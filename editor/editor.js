import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

const editor = new Editor({
    element: document.querySelector('#editor'),
    extensions: [
        StarterKit,
    ],
    content: `
        <h1>Welcome to your Notebook!</h1>
        <p>Start writing here. You can use the buttons above to format your text.</p>
        <p>This is a separate page to keep your clock and notes organized.</p>
    `,
});