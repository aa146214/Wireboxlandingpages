export default function fillPlaceholders(str: string) {
	return str.replaceAll("[[contact]]", "<a style='text-decoration: underline; color: var(--color-light-yellow)' href='/#contact'>contact</a>")
}
