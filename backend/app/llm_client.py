"""The single switchable point for every LLM call in this backend.

Every call site in the app (Flowchart, Sequence, Infographic, Story Builder,
and Spec Builder) does exactly one kind of LLM call -- structured output:
a system prompt + a user message in, one parsed Pydantic model out. None of
them do tool-calling or a multi-turn conversation. That means a single
narrow interface covers the whole app, and swapping providers is one
environment variable (`LLM_PROVIDER` in backend/.env) rather than a change
to any of the ~20 call sites that use it.

Call `generate_structured()` (async, for the WebSocket-driven generation
flows) or `generate_structured_sync()` (sync, for Spec Builder's route
handlers, which aren't async) -- never construct an OpenAI client directly
in a route/generator module.
"""

from __future__ import annotations

import abc
from functools import lru_cache
from typing import TypeVar

from openai import AsyncOpenAI, OpenAI
from pydantic import BaseModel

from app.config import get_settings

T = TypeVar("T", bound=BaseModel)


class LLMProvider(abc.ABC):
    """One structured-output call, in both an async and a sync form --
    async for the WebSocket-driven generators, sync for Spec Builder's
    (non-async) route handlers. Both must produce the same result for the
    same inputs; a provider is free to implement them however its
    underlying client requires."""

    @abc.abstractmethod
    async def generate(self, *, system_prompt: str, user_message: str, response_model: type[T]) -> T: ...

    @abc.abstractmethod
    def generate_sync(self, *, system_prompt: str, user_message: str, response_model: type[T]) -> T: ...


class OpenAIProvider(LLMProvider):
    """The default provider -- OpenAI's own structured-output support
    (`.beta.chat.completions.parse`), which enforces the Pydantic schema
    server-side rather than trusting the model to get JSON right."""

    def __init__(self, api_key: str, model: str) -> None:
        self._model = model
        self._async_client = AsyncOpenAI(api_key=api_key)
        self._sync_client = OpenAI(api_key=api_key)

    async def generate(self, *, system_prompt: str, user_message: str, response_model: type[T]) -> T:
        completion = await self._async_client.beta.chat.completions.parse(
            model=self._model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            response_format=response_model,
        )
        return _require_parsed(completion, response_model)

    def generate_sync(self, *, system_prompt: str, user_message: str, response_model: type[T]) -> T:
        completion = self._sync_client.beta.chat.completions.parse(
            model=self._model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            response_format=response_model,
        )
        return _require_parsed(completion, response_model)


def _require_parsed(completion, response_model: type[T]) -> T:
    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError(f"LLM response did not include a parsed {response_model.__name__}.")
    return parsed


class CorporateLLMProvider(LLMProvider):
    """Placeholder for the internal/corporate LLM. Deliberately left
    unimplemented: the client is an internal package installed via `pip
    install` (not a raw HTTP gateway), and its exact package name and
    client API weren't available when this was written. `_call()` below
    is the ONLY thing that needs filling in -- both
    `generate()`/`generate_sync()` and every call site in the app already
    route through it via `get_llm_provider()`.

    What `_call()` needs to do, once you have the real package:
      1. Add the package to requirements.txt (only in environments that
         actually use `LLM_PROVIDER=corporate` -- see the comment there).
      2. `import` it INSIDE `_call()`, not at module top. That keeps this
         module importable -- and every `LLM_PROVIDER=openai` environment
         (e.g. this sandbox, CI, anyone without access to the internal
         package index) working -- without the corporate package
         installed at all.
      3. Build whatever request/client call the package's API wants from
         (system_prompt, user_message, response_model). `self._base_url` /
         `self._api_key` / `self._model` come from CORPORATE_LLM_BASE_URL /
         CORPORATE_LLM_API_KEY / CORPORATE_LLM_MODEL in backend/.env, if
         the package's client needs them explicitly -- some internal
         SDKs instead pick up their own auth/endpoint from env vars or
         SSO automatically, in which case these three can be ignored (or
         dropped from Settings once you know which).
      4. Turn its response into `response_model`. If the package doesn't
         support strict JSON-schema enforcement the way OpenAI's `.parse()`
         does, the safest approach is: instruct the model in the system
         prompt to return ONLY a JSON object matching the schema, then
         call `response_model.model_validate_json(raw_text)` yourself --
         every system prompt in this app already describes its schema in
         prose, so this usually works without changing them.

    Until this is filled in, keep `LLM_PROVIDER=openai` in backend/.env.
    """

    def __init__(self, base_url: str, api_key: str, model: str) -> None:
        self._base_url = base_url
        self._api_key = api_key
        self._model = model

    def _call(self, *, system_prompt: str, user_message: str, response_model: type[T]) -> T:
        # from your_internal_package import Client  # import here, not at module top -- see class docstring
        raise NotImplementedError(
            "CorporateLLMProvider isn't wired up yet -- see the class docstring in "
            "app/llm_client.py for exactly what to implement. Set LLM_PROVIDER=openai "
            "in backend/.env until it's ready."
        )

    async def generate(self, *, system_prompt: str, user_message: str, response_model: type[T]) -> T:
        return self._call(system_prompt=system_prompt, user_message=user_message, response_model=response_model)

    def generate_sync(self, *, system_prompt: str, user_message: str, response_model: type[T]) -> T:
        return self._call(system_prompt=system_prompt, user_message=user_message, response_model=response_model)


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    if settings.llm_provider == "corporate":
        return CorporateLLMProvider(
            base_url=settings.corporate_llm_base_url,
            api_key=settings.corporate_llm_api_key,
            model=settings.corporate_llm_model,
        )
    return OpenAIProvider(api_key=settings.openai_api_key, model=settings.openai_model)


async def generate_structured(system_prompt: str, user_message: str, response_model: type[T]) -> T:
    """The async entry point for Flowchart/Sequence/Infographic/Story
    Builder's WebSocket-driven generators."""
    return await get_llm_provider().generate(
        system_prompt=system_prompt, user_message=user_message, response_model=response_model
    )


def generate_structured_sync(system_prompt: str, user_message: str, response_model: type[T]) -> T:
    """The sync entry point for Spec Builder's route handlers (see
    app/spec_builder/agents.py)."""
    return get_llm_provider().generate_sync(
        system_prompt=system_prompt, user_message=user_message, response_model=response_model
    )
