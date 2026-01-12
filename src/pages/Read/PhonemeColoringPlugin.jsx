// src/pages/Read/PhonemeColoringPlugin.jsx
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection } from 'lexical';

function PhonemeColoringPlugin({ colorEngine }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!colorEngine) return;

    const unregister = editor.registerUpdateListener(({ editorState }) => {
      // We don't want to color the text while the user is typing.
      // This is a simplified check. A better solution would be to use a debounce.
      if (editor.isComposing() || $getSelection() !== null) {
        return;
      }

      editor.update(() => {
        const root = $getRoot();
        const textNodes = root.getAllTextNodes();

        textNodes.forEach(node => {
          const text = node.getTextContent();
          const words = text.split(/(\s+)/);

          // This is still not right. It will re-render the whole text.
          // I need to be smarter about this.
        });
      });
    });

    return () => unregister();
  }, [editor, colorEngine]);

  return null;
}

export default PhonemeColoringPlugin;
