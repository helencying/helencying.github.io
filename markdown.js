const container = document.querySelector("[data-markdown]");
const params = new URLSearchParams(window.location.search);
const file = params.get("file") || "pages/first-note.md";

const escapeHtml = (value) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");

const inlineMarkdown = (value) => {
	let html = escapeHtml(value);
	html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
	html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
	html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
	return html;
};

const renderMarkdown = (markdown) => {
	const lines = markdown.trim().split(/\r?\n/);
	const html = [];
	let listOpen = false;

	const closeList = () => {
		if (listOpen) {
			html.push("</ul>");
			listOpen = false;
		}
	};

	lines.forEach((line) => {
		const trimmed = line.trim();

		if (!trimmed) {
			closeList();
			return;
		}

		if (trimmed.startsWith("# ")) {
			closeList();
			html.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
			return;
		}

		if (trimmed.startsWith("## ")) {
			closeList();
			html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
			return;
		}

		if (trimmed.startsWith("### ")) {
			closeList();
			html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
			return;
		}

		if (trimmed.startsWith("- ")) {
			if (!listOpen) {
				html.push("<ul>");
				listOpen = true;
			}
			html.push(`<li>${inlineMarkdown(trimmed.slice(2))}</li>`);
			return;
		}

		closeList();
		html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
	});

	closeList();
	return html.join("");
};

const isAllowedPage = (path) => /^pages\/[a-z0-9-]+\.md$/i.test(path);

if (!isAllowedPage(file)) {
	container.innerHTML = "<h1>Page not found</h1><p>That page path is not allowed.</p>";
} else {
	fetch(file)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Page not found");
			}
			return response.text();
		})
		.then((markdown) => {
			container.innerHTML = renderMarkdown(markdown);
			const title = container.querySelector("h1");
			if (title) {
				document.title = `${title.textContent} - My Blog`;
			}
		})
		.catch(() => {
			container.innerHTML = "<h1>Page not found</h1><p>Check that the markdown file exists in the pages folder.</p>";
		});
}
