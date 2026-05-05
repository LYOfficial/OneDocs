from __future__ import annotations

import os
import subprocess
import sys
from typing import Any, Iterable, overload

try:
    from typing import Literal  # python >=3.8
except ImportError:
    from typing_extensions import Literal

ROOT_DIR = os.path.dirname(__file__)


@overload
def _program(
    name: str,
    args: Iterable[str],
    return_completed_process: Literal[True],
    **kwargs: Any,
) -> subprocess.CompletedProcess[str | bytes]: ...


@overload
def _program(
    name: str,
    args: Iterable[str],
    return_completed_process: Literal[False] = ...,
    **kwargs: Any,
) -> subprocess.CompletedProcess[str | bytes]: ...


@overload
def _program(
    name: str,
    args: Iterable[str],
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]: ...


def _program(
    name: str,
    args: Iterable[str],
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]:
    bin_dir = ROOT_DIR if os.name == "nt" else os.path.join(ROOT_DIR, "bin")
    complete_process = subprocess.run([os.path.join(bin_dir, name), *args], **kwargs)
    if return_completed_process:
        return complete_process
    return complete_process.returncode


@overload
def call_node(
    *args: str, return_completed_process: Literal[True], **kwargs: Any
) -> subprocess.CompletedProcess[str | bytes]: ...


@overload
def call_node(
    *args: str, return_completed_process: Literal[False] = ..., **kwargs: Any
) -> int: ...


@overload
def call_node(
    *args: str, return_completed_process: bool = False, **kwargs: Any
) -> int | subprocess.CompletedProcess[str | bytes]: ...


def call_node(
    *args: str, return_completed_process: bool = False, **kwargs: Any
) -> int | subprocess.CompletedProcess[str | bytes]:
    suffix = ".exe" if os.name == "nt" else ""
    return _program(
        "node" + suffix,
        list(args),
        return_completed_process=return_completed_process,
        **kwargs,
    )


@overload
def node(
    args: Iterable[str] | None, return_completed_process: Literal[True], **kwargs: Any
) -> subprocess.CompletedProcess[str | bytes]: ...


@overload
def node(
    args: Iterable[str] | None,
    return_completed_process: Literal[False] = ...,
    **kwargs: Any,
) -> int: ...


@overload
def node(
    args: Iterable[str] | None = None,
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]: ...


def node(
    args: Iterable[str] | None = None,
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]:
    """Call the node executable with the given arguments.

    Parameters
    ----------
    args : Optional[list[str]], default=None
        List of arguments to pass to the node executable.
        If None, the arguments are taken from sys.argv[1:].
    return_completed_process : bool, default=False
        If True, return the CompletedProcess[str | bytes] object instead of the return code.
    **kwargs : dict[str, Any]
        Other arguments passed to subprocess.call

    Returns
    -------
    int | subprocess.CompletedProcess[str | bytes]
        Return code of the node executable or the CompletedProcess[str | bytes] object.
    """
    if args is None:
        args = sys.argv[1:]
    return call_node(*args, return_completed_process=return_completed_process, **kwargs)


@overload
def npm(
    args: Iterable[str] | None, return_completed_process: Literal[True], **kwargs: Any
) -> subprocess.CompletedProcess[str | bytes]: ...


@overload
def npm(
    args: Iterable[str] | None,
    return_completed_process: Literal[False] = ...,
    **kwargs: Any,
) -> int: ...


@overload
def npm(
    args: Iterable[str] | None = None,
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]: ...


def npm(
    args: Iterable[str] | None = None,
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]:
    """Call the npm executable with the given arguments.

    Parameters
    ----------
    args : Optional[list[str]], default=None
        List of arguments to pass to the npm executable.
        If None, the arguments are taken from sys.argv[1:].
    return_completed_process : bool, default=False
        If True, return the CompletedProcess[str | bytes] object instead of the return code.
    **kwargs : dict[str, Any]
        Other arguments passed to subprocess.call

    Returns
    -------
    int | subprocess.CompletedProcess[str | bytes]
        Return code of the npm executable or the CompletedProcess[str | bytes] object.
    """
    if args is None:
        args = sys.argv[1:]
    return call_node(
        os.path.join(ROOT_DIR, "lib", "node_modules", "npm", "bin", "npm-cli.js"),
        *args,
        return_completed_process=return_completed_process,
        **kwargs,
    )


@overload
def npx(
    args: Iterable[str] | None, return_completed_process: Literal[True], **kwargs: Any
) -> subprocess.CompletedProcess[str | bytes]: ...


@overload
def npx(
    args: Iterable[str] | None,
    return_completed_process: Literal[False] = ...,
    **kwargs: Any,
) -> int: ...


@overload
def npx(
    args: Iterable[str] | None = None,
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]: ...


def npx(
    args: Iterable[str] | None = None,
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]:
    """Call the npx executable with the given arguments.

    Parameters
    ----------
    args : Optional[list[str]], default=None
        List of arguments to pass to the npx executable.
        If None, the arguments are taken from sys.argv[1:].
    return_completed_process : bool, default=False
        If True, return the CompletedProcess[str | bytes] object instead of the return code.
    **kwargs : dict[str, Any]
        Other arguments passed to subprocess.call

    Returns
    -------
    int | subprocess.CompletedProcess[str | bytes]
        Return code of the npx executable, or the CompletedProcess[str | bytes] object.
    """
    if args is None:
        args = sys.argv[1:]
    return call_node(
        os.path.join(ROOT_DIR, "lib", "node_modules", "npm", "bin", "npx-cli.js"),
        *args,
        return_completed_process=return_completed_process,
        **kwargs,
    )


@overload
def corepack(
    args: Iterable[str] | None, return_completed_process: Literal[True], **kwargs: Any
) -> subprocess.CompletedProcess[str | bytes]: ...


@overload
def corepack(
    args: Iterable[str] | None,
    return_completed_process: Literal[False] = ...,
    **kwargs: Any,
) -> int: ...


@overload
def corepack(
    args: Iterable[str] | None = None,
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]: ...


def corepack(
    args: Iterable[str] | None = None,
    return_completed_process: bool = False,
    **kwargs: Any,
) -> int | subprocess.CompletedProcess[str | bytes]:
    """Call the corepack executable with the given arguments.

    Parameters
    ----------
    args : Optional[list[str]], default=None
        List of arguments to pass to the corepack executable.
        If None, the arguments are taken from sys.argv[1:].
    return_completed_process : bool, default=False
        If True, return the CompletedProcess[str | bytes] object instead of the return code.
    **kwargs : dict[str, Any]
        Other arguments passed to subprocess.call

    Returns
    -------
    int | subprocess.CompletedProcess[str | bytes]
        Return code of the corepack executable, or the CompletedProcess[str | bytes] object.
    """
    if args is None:
        args = sys.argv[1:]
    return call_node(
        os.path.join(
            ROOT_DIR, "lib", "node_modules", "corepack", "dist", "corepack.js"
        ),
        *args,
        return_completed_process=return_completed_process,
        **kwargs,
    )


def _node_entry_point() -> None:
    raise SystemExit(node(close_fds=False))


def _npm_entry_point() -> None:
    raise SystemExit(npm(close_fds=False))


def _npx_entry_point() -> None:
    raise SystemExit(npx(close_fds=False))


def _corepack_entry_point() -> None:
    raise SystemExit(corepack(close_fds=False))
