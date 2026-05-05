"""
A prompt management module using Jinja to generate complex prompts with simple templates.
"""

import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Union, Callable

from jinja2 import Environment, FileSystemLoader, Template
from jinja2.sandbox import SandboxedEnvironment
from pydantic import BaseModel

prompt_path_default = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "prompts"
)
prompt_path_custom = os.getenv("PROMPTS_PATH")

env_default = SandboxedEnvironment(loader=FileSystemLoader(prompt_path_default))


@dataclass
class Prompter:
    """
    A class for managing and rendering prompt templates.

    Attributes:
        prompt_template (str, optional): The name of the prompt template file.
        prompt_variation (str, optional): The variation of the prompt template.
        prompt_text (str, optional): The raw prompt text.
        template (Union[str, Template], optional): The Jinja2 template object.
    """

    prompt_template: Optional[str] = None
    prompt_variation: Optional[str] = "default"
    prompt_text: Optional[str] = None
    template: Optional[Union[str, Template]] = None
    template_text: Optional[str] = None
    parser: Optional[Any] = None
    text_templates: Optional[Dict[str, str]] = None
    prompt_folders: Optional[List[str]] = None

    def __init__(
        self,
        prompt_template: str | None = None,
        model: str | Any | None = None,
        prompt_variation: str = "default",
        prompt_dir: str | None = None,
        template_text: str | None = None,
        parser: Callable[[str], dict[str, Any]] | None = None,
        *args,
        **kwargs,
    ) -> None:
        """Initialize the Prompter with a template name, model, and optional custom directory.

        Args:
            prompt_template (str, optional): The name of the prompt template (without .jinja extension).
            model (Union[str, Any], optional): The model to use for generation.
            prompt_variation (str, optional): The variation of the prompt template.
            prompt_dir (str, optional): Custom directory to search for templates.
            template_text (str, optional): The raw text of the template.
            parser (Callable[[str], dict[str, Any]], optional): The parser to use for generation.
        """
        if template_text is not None and prompt_template is not None:
            raise ValueError(
                "Cannot provide both template_text and prompt_template. Choose one or the other."
            )
        self.prompt_template = prompt_template
        self.prompt_variation = prompt_variation
        self.prompt_dir = prompt_dir
        self.template_text = template_text
        self.parser = parser
        self.template: Template | None = None
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4-turbo")
        self.text_templates = {}
        self.prompt_folders = []
        self._setup_template(template_text, prompt_dir)

    def _build_prompt_dirs(self, prompt_dir: Optional[str] = None) -> list[str]:
        """Build the list of directories to search for prompt templates.

        Args:
            prompt_dir (str, optional): Custom directory to search for templates.

        Returns:
            list[str]: Ordered list of directories to search.
        """
        prompt_dirs = []
        if prompt_dir:
            prompt_dirs.append(prompt_dir)
        prompts_path = os.getenv("PROMPTS_PATH")
        if prompts_path is not None:
            prompt_dirs.extend(prompts_path.split(":"))

        # Add current working directory + /prompts
        cwd_prompts = os.path.join(os.getcwd(), "prompts")
        if os.path.exists(cwd_prompts):
            prompt_dirs.append(cwd_prompts)

        # Try to find project root and add its prompts folder
        current_path = os.getcwd()
        while current_path != os.path.dirname(current_path):  # Stop at root
            # Check for common project indicators
            if any(os.path.exists(os.path.join(current_path, indicator))
                   for indicator in ['pyproject.toml', 'setup.py', 'setup.cfg', '.git']):
                project_prompts = os.path.join(current_path, "prompts")
                if os.path.exists(project_prompts) and project_prompts not in prompt_dirs:
                    prompt_dirs.append(project_prompts)
                break
            current_path = os.path.dirname(current_path)

        # Fallback to ~/ai-prompter
        prompt_dirs.append(os.path.expanduser("~/ai-prompter"))

        # Default package prompts folder
        if os.path.exists(prompt_path_default):
            prompt_dirs.append(prompt_path_default)

        return prompt_dirs

    def _setup_template(
        self, template_text: Optional[str] = None, prompt_dir: Optional[str] = None
    ) -> None:
        """Set up the Jinja2 template based on the provided template file or text.

        Args:
            template_text (str, optional): The raw text of the template.
            prompt_dir (str, optional): Custom directory to search for templates.
        """
        prompt_dirs = self._build_prompt_dirs(prompt_dir)
        self.prompt_folders = prompt_dirs
        env = SandboxedEnvironment(loader=FileSystemLoader(prompt_dirs))

        if template_text is None:
            if self.prompt_template is None:
                raise ValueError(
                    "Either prompt_template or template_text must be provided"
                )
            if not self.prompt_template:
                raise ValueError("Template name cannot be empty")
            # Strip .jinja extension if present to avoid double extension
            template_name = self.prompt_template
            if template_name.endswith('.jinja'):
                template_name = template_name[:-6]  # Remove '.jinja'
            self.template = env.get_template(f"{template_name}.jinja")
        else:
            self.template_text = template_text
            self.template = env.from_string(template_text)
            self.text_templates[self.prompt_template] = template_text

    def to_langchain(self):
        # Support for both text-based and file-based templates with LangChain
        try:
            from langchain_core.prompts import ChatPromptTemplate
        except ImportError:
            raise ImportError(
                "langchain-core is required for to_langchain; install with `pip install .[langchain]`"
            )
        from jinja2 import Template, Environment, FileSystemLoader
        import os
        import re
        if self.template_text is not None:
            template_content = self.template_text
            return ChatPromptTemplate.from_template(
                template_content, template_format="jinja2"
            )
        elif self.prompt_template is not None and self.template is not None:
            # For file-based templates, we need to get the raw string content with includes resolved
            if isinstance(self.template, Template):
                try:
                    # Use the same logic as Prompter initialization for finding prompt_dir
                    if self.prompt_dir is None:
                        # Check for PROMPTS_PATH environment variable
                        prompts_path = os.environ.get("PROMPTS_PATH")
                        if prompts_path:
                            self.prompt_dir = prompts_path
                        else:
                            # Check a series of default directories
                            potential_dirs = [
                                os.path.join(os.getcwd(), "prompts"),
                                os.path.join(os.path.dirname(os.path.abspath(__file__)), "prompts"),
                                os.path.join(os.path.expanduser("~"), ".prompts"),
                            ]
                            for dir_path in potential_dirs:
                                if os.path.exists(dir_path):
                                    self.prompt_dir = dir_path
                                    break
                            if self.prompt_dir is None:
                                raise ValueError(
                                    "No prompt directory found. Please set PROMPTS_PATH environment variable "
                                    "or specify prompt_dir when initializing Prompter with a prompt_template."
                                )
                    # Function to manually resolve includes while preserving variables
                    def resolve_includes(template_name, base_dir, visited=None):
                        if visited is None:
                            visited = set()
                        if template_name in visited:
                            raise ValueError(f"Circular include detected for {template_name}")
                        visited.add(template_name)
                        # Strip .jinja extension if present to avoid double extension
                        clean_name = template_name
                        if clean_name.endswith('.jinja'):
                            clean_name = clean_name[:-6]  # Remove '.jinja'
                        template_file = os.path.join(base_dir, f"{clean_name}.jinja")
                        if not os.path.exists(template_file):
                            raise ValueError(f"Template file {template_file} not found")
                        with open(template_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                        # Find all include statements
                        include_pattern = r"{%\s*include\s*['\"]([^'\"]+)['\"]\s*%}"
                        matches = re.findall(include_pattern, content)
                        for included_template in matches:
                            included_content = resolve_includes(included_template, base_dir, visited)
                            placeholder = "{% include '" + included_template + "' %}"
                            content = content.replace(placeholder, included_content)
                        visited.remove(template_name)
                        return content
                    # Resolve includes for the main template
                    template_content = resolve_includes(self.prompt_template, self.prompt_dir)
                    return ChatPromptTemplate.from_template(
                        template_content, template_format="jinja2"
                    )
                except Exception as e:
                    raise ValueError(f"Error processing template for LangChain: {str(e)}")
            else:
                raise ValueError(
                    "Template is not properly initialized for LangChain conversion"
                )
        else:
            raise ValueError(
                "Either prompt_template with a valid template or template_text must be provided for LangChain conversion"
            )

    def template_location(self, template_name: str) -> str:
        """
        Returns the location of the template used for the given template name.
        If the template is a text template (not a file), returns 'text'.
        If the template is not found, returns 'not found'.
        
        Args:
            template_name (str): The name of the template to check.
        
        Returns:
            str: The file path of the template, or 'text' if it's a text template, or 'not found' if the template doesn't exist.
        """
        if template_name in self.text_templates:
            return 'text'
        
        for folder in self.prompt_folders:
            # Strip .jinja extension if present to avoid double extension
            clean_name = template_name
            if clean_name.endswith('.jinja'):
                clean_name = clean_name[:-6]  # Remove '.jinja'
            template_file = os.path.join(folder, f"{clean_name}.jinja")
            if os.path.exists(template_file):
                return template_file
        
        return 'not found'

    @classmethod
    def from_text(
        cls, text: str, model: Optional[Union[str, Any]] = None
    ) -> "Prompter":
        """Create a Prompter instance from raw text, which can contain Jinja code.

        Args:
            text (str): The raw template text.
            model (Union[str, Any], optional): The model to use for generation.

        Returns:
            Prompter: A new Prompter instance.
        """
        return cls(template_text=text, model=model)

    def render(self, data: Optional[Union[Dict, BaseModel]] = None) -> str:
        """
        Render the prompt template with the given data.

        Args:
            data (Union[Dict, BaseModel]): The data to be used in rendering the template.
                Can be either a dictionary or a Pydantic BaseModel.

        Returns:
            str: The rendered prompt text.

        Raises:
            AssertionError: If the template is not defined or not a Jinja2 Template.
        """
        if isinstance(data, BaseModel):
            data_dict = data.model_dump()
        elif isinstance(data, dict):
            data_dict = data
        else:
            data_dict = {}
        render_data = dict(data_dict)
        render_data["current_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if self.parser:
            render_data["format_instructions"] = self.parser.get_format_instructions()
        assert self.template, "Prompter template is not defined"
        assert isinstance(
            self.template, Template
        ), "Prompter template is not a Jinja2 Template"
        return self.template.render(render_data)
