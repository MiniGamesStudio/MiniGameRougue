'use strict';

module.exports = {
    load() {},
    unload() {},
    methods: {
        openPanel() {
            Editor.Panel.open('sheep-level-editor.default');
        },
        'open-panel'() {
            this.openPanel();
        },
    },
};
