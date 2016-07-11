(function () {
    'use strict';

    var MergeCodeForm = MediumEditor.extensions.form.extend({

        name: 'mergecode',
        action: 'mergeCode',
        aria: 'Insert Merge code',
        contentDefault: '{M}',
        contentFA: '<i class="fa fa-compress fa-1" aria-hidden="true"></i>',
        init: function () {
            MediumEditor.extensions.form.prototype.init.apply(this, arguments);
        },

        // Called when the button the toolbar is clicked
        // Overrides ButtonExtension.handleClick
        handleClick: function (event) {
            event.preventDefault();
            event.stopPropagation();
            this.showForm();
            return false;
        },

        // Called by medium-editor to append form to the toolbar
        getForm: function () {
            if (!this.form) {
                this.form = this.createForm();
            }
            return this.form;
        },

        // Used by medium-editor when the default toolbar is to be displayed
        isDisplayed: function () {
            return this.getForm().style.display === 'block';
        },

        hideForm: function () {
            this.getForm().style.display = 'none';
            this.getSelect().value = '';
        },

        showForm: function () {
            var input = this.getSelect();

            this.base.saveSelection();
            this.hideToolbarDefaultActions();
            this.getForm().style.display = 'block';
            this.setToolbarPosition();
            input.focus();
        },

        // Called by core when tearing down medium-editor (destroy)
        destroy: function () {
            if (!this.form) {
                return false;
            }

            if (this.form.parentNode) {
                this.form.parentNode.removeChild(this.form);
            }

            delete this.form;
        },

        // core methods

        doFormSave: function () {
            this.base.restoreSelection();
            this.base.checkSelection();
        },

        doFormCancel: function () {
            this.base.restoreSelection();
            this.clearMergeCode();
            this.base.checkSelection();
        },

        // form creation and event handling
        createForm: function () {
            var doc = this.document,
                form = doc.createElement('div'),
                select = doc.createElement('select'),
                //close = doc.createElement('a'),
                save = doc.createElement('a');

            // Merge Code Form (div)
            form.className = 'medium-editor-toolbar-form';
            form.id = 'medium-editor-toolbar-form-mergecode-' + this.getEditorId();

            // Handle clicks on the form itself
            this.on(form, 'click', this.handleFormClick.bind(this));
            var option = doc.createElement('option');
            option.innerHTML = 'Select Merge Code';
            option.value = '';
            select.appendChild(option);
            var codes = this.getEditorOption('mergeCodes');
            for (var i = 0; i < codes.length; i++) {
                option = doc.createElement('option');
                option.innerHTML = codes[i].label;
                option.value = codes[i].code;
                select.appendChild(option);
            }

            select.className = 'medium-editor-toolbar-select-merge-code';
            form.appendChild(select);

            // Handle typing in the textbox
            this.on(select, 'change', this.handleSelectChange.bind(this));

            // Add save buton
            save.setAttribute('href', '#');
            save.className = 'medium-editor-toobar-save';
            save.innerHTML = this.getEditorOption('buttonLabels') === 'fontawesome' ?
                             '<i class="fa fa-check"></i>' :
                             '&#10003;';
            form.appendChild(save);

            // Handle save button clicks (capture)
            this.on(save, 'click', this.handleSaveClick.bind(this), true);

            // Add close button
            /*
            close.setAttribute('href', '#');
            close.className = 'medium-editor-toobar-close';
            close.innerHTML = this.getEditorOption('buttonLabels') === 'fontawesome' ?
                              '<i class="fa fa-times"></i>' :
                              '&times;';
            form.appendChild(close);

            // Handle close button clicks
            this.on(close, 'click', this.handleCloseClick.bind(this));
            */
            return form;
        },

        getSelect: function () {
            return this.getForm().querySelector('select.medium-editor-toolbar-select-merge-code');
        },

        clearMergeCode: function () {
            // TODO: yet to implement
        },

        checkForParentLiTag: function (node) {
            // TODO: Replace with MediumEditor.util.isMediumEditorElement(node)
            if (node.id === this.base.elements[0].id) {
                throw Error('At least one list element should be present !');
            } else if (node.tagName !== 'LI') {
                return this.checkForParentLiTag(node.parentNode);
            } else {
                return node;
            }
        },

        handleSelectChange: function () {
            var code = this.getSelect().value;
            if (code !== '') {
                var range = MediumEditor.selection.getSelectionRange(this.document);
                range.deleteContents();
                var node = this.document.createTextNode(code);
                range.insertNode(node);
                // To update text selection
                range.selectNodeContents(node);
                var sel = this.document.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        },

        handleFormClick: function (event) {
            // make sure not to hide form when clicking inside the form
            event.stopPropagation();
        },

        handleSaveClick: function (event) {
            // Clicking Save -> create the merge code
            event.preventDefault();
            this.doFormSave();
        },

        handleCloseClick: function (event) {
            // Click Close -> close the form
            event.preventDefault();
            this.doFormCancel();
        }
    });

    MediumEditor.extensions.mergeCode = MergeCodeForm;
}());
