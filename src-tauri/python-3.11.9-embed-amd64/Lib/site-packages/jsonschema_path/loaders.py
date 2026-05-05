# Use CSafeFile if available
import re
from collections.abc import Iterable
from typing import TYPE_CHECKING
from typing import Any
from typing import cast

if TYPE_CHECKING:
    from yaml import SafeLoader
else:
    try:
        from yaml import CSafeLoader as SafeLoader
    except ImportError:
        from yaml import SafeLoader


__all__ = [
    "SafeLoader",
]


SCIENTIFIC_FLOAT_RE = re.compile(
    r"""
    ^(?:
        [-+]?
        (?:
            (?:0|[1-9][0-9]*)\.[0-9]*
            |
            \.[0-9]+
            |
            (?:0|[1-9][0-9]*)
        )
        [eE][-+]?[0-9]+
    )$
    """,
    re.VERBOSE,
)


class LimitedSafeLoader(type):
    """Meta YAML loader that skips the resolution of the specified YAML tags."""

    def __new__(
        cls,
        name: str,
        bases: tuple[type, ...],
        namespace: dict[str, Any],
        exclude_resolvers: Iterable[str],
    ) -> "LimitedSafeLoader":
        exclude_resolvers = set(exclude_resolvers)
        implicit_resolvers = {
            key: [
                (tag, regex)
                for tag, regex in mappings
                if tag not in exclude_resolvers
            ]
            for key, mappings in SafeLoader.yaml_implicit_resolvers.items()
        }
        return super().__new__(
            cls,
            name,
            (SafeLoader, *bases),
            {**namespace, "yaml_implicit_resolvers": implicit_resolvers},
        )


class JsonschemaSafeLoader(
    metaclass=LimitedSafeLoader,
    exclude_resolvers={"tag:yaml.org,2002:timestamp"},
):
    """A safe YAML loader that leaves timestamps as strings."""


cast(type[SafeLoader], JsonschemaSafeLoader).add_implicit_resolver(  # type: ignore[no-untyped-call]
    "tag:yaml.org,2002:float",
    SCIENTIFIC_FLOAT_RE,
    list("-+0123456789."),
)
