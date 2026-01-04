import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * TipTap mark for tracked insertions
 */
export const TrackInsertion = Mark.create({
  name: 'trackInsertion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      changeId: {
        default: null,
        parseHTML: element => element.getAttribute('data-change-id'),
        renderHTML: attributes => {
          if (!attributes.changeId) {
            return {};
          }
          return {
            'data-change-id': attributes.changeId,
          };
        },
      },
      userId: {
        default: null,
        parseHTML: element => element.getAttribute('data-user-id'),
        renderHTML: attributes => {
          if (!attributes.userId) {
            return {};
          }
          return {
            'data-user-id': attributes.userId,
          };
        },
      },
      userName: {
        default: null,
        parseHTML: element => element.getAttribute('data-user-name'),
        renderHTML: attributes => {
          if (!attributes.userName) {
            return {};
          }
          return {
            'data-user-name': attributes.userName,
          };
        },
      },
      timestamp: {
        default: null,
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes.timestamp) {
            return {};
          }
          return {
            'data-timestamp': attributes.timestamp,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'ins[data-change-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['ins', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'track-insertion' }), 0];
  },
});

/**
 * TipTap mark for tracked deletions
 */
export const TrackDeletion = Mark.create({
  name: 'trackDeletion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      changeId: {
        default: null,
        parseHTML: element => element.getAttribute('data-change-id'),
        renderHTML: attributes => {
          if (!attributes.changeId) {
            return {};
          }
          return {
            'data-change-id': attributes.changeId,
          };
        },
      },
      userId: {
        default: null,
        parseHTML: element => element.getAttribute('data-user-id'),
        renderHTML: attributes => {
          if (!attributes.userId) {
            return {};
          }
          return {
            'data-user-id': attributes.userId,
          };
        },
      },
      userName: {
        default: null,
        parseHTML: element => element.getAttribute('data-user-name'),
        renderHTML: attributes => {
          if (!attributes.userName) {
            return {};
          }
          return {
            'data-user-name': attributes.userName,
          };
        },
      },
      timestamp: {
        default: null,
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes.timestamp) {
            return {};
          }
          return {
            'data-timestamp': attributes.timestamp,
          };
        },
      },
      originalText: {
        default: null,
        parseHTML: element => element.getAttribute('data-original-text'),
        renderHTML: attributes => {
          if (!attributes.originalText) {
            return {};
          }
          return {
            'data-original-text': attributes.originalText,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'del[data-change-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['del', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'track-deletion' }), 0];
  },
});
