const previousMarkup = new WeakMap<HTMLElement, string>();

/** Keep live nodes (animation, focus, scroll and handlers) across room snapshots. */
export function patchMarkup(container: HTMLElement, html: string): void {
  if (previousMarkup.get(container) === html) return;
  const template = document.createElement('template');
  template.innerHTML = html;
  patchChildren(container, template.content);
  previousMarkup.set(container, html);
}

function patchChildren(current: Node, next: Node): void {
  const children = Array.from(next.childNodes);
  for (let i = 0; i < children.length; i++) {
    const desired = children[i];
    const existing = current.childNodes[i];
    if (!existing) {
      current.appendChild(desired.cloneNode(true));
    } else if (!sameElement(existing, desired)) {
      current.replaceChild(desired.cloneNode(true), existing);
    } else if (existing instanceof Element && desired instanceof Element) {
      for (const attr of Array.from(existing.attributes)) {
        if (!desired.hasAttribute(attr.name)) existing.removeAttribute(attr.name);
      }
      for (const attr of Array.from(desired.attributes)) {
        if (existing.getAttribute(attr.name) !== attr.value) existing.setAttribute(attr.name, attr.value);
      }
      patchChildren(existing, desired);
    } else if (existing.nodeValue !== desired.nodeValue) {
      existing.nodeValue = desired.nodeValue;
    }
  }
  while (current.childNodes.length > children.length) current.removeChild(current.lastChild!);
}

function sameElement(a: Node, b: Node): boolean {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return false;
  if (a instanceof Element && b instanceof Element) return a.id === b.id;
  return true;
}
