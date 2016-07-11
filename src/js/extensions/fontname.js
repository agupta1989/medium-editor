(function () {
    'use strict';

    var FontNameForm = MediumEditor.extensions.form.extend({

        name: 'fontname',
        action: 'fontName',
        aria: 'change font name',
        contentDefault: '<b>Aa</b>',
        contentFA: '<i class="fa fa-font"></i>',

        fonts: ['', 'Arial', 'Arial Black', 'Courier New', 'Helvetica', 'Comic Sans MS', 'Tahoma', 'Times New Roman', 'Verdana'],

        init: function () {
            MediumEditor.extensions.form.prototype.init.apply(this, arguments);
        },

        // Called when the button the toolbar is clicked
        // Overrides ButtonExtension.handleClick
        handleClick: function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (!this.isDisplayed()) {
                // Get FontName of current selection (convert to string since IE returns this as number)
                var fontName = this.document.queryCommandValue('fontName') + '';
                this.showForm(fontName);
            }

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

        showForm: function (fontName) {
            var select = this.getSelect();

            this.base.saveSelection();
            this.hideToolbarDefaultActions();
            this.getForm().style.display = 'block';
            this.setToolbarPosition();

            select.value = fontName || '';
            select.focus();
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
            this.clearFontName();
            this.base.checkSelection();
        },

        // form creation and event handling
        createForm: function () {
            var doc = this.document,
                form = doc.createElement('div'),
                select = doc.createElement('select'),
                close = doc.createElement('a'),
                save = doc.createElement('a'),
                option;

            // Font Name Form (div)
            form.className = 'medium-editor-toolbar-form';
            form.id = 'medium-editor-toolbar-form-fontname-' + this.getEditorId();

            // Handle clicks on the form itself
            this.on(form, 'click', this.handleFormClick.bind(this));

            // Add font names
            for (var i = 0; i<this.fonts.length; i++) {
                option = doc.createElement('option');
                option.innerHTML = this.fonts[i];
                option.value = this.fonts[i];
                select.appendChild(option);
            }

            select.className = 'medium-editor-toolbar-select-font-name';
            form.appendChild(select);

            // Handle typing in the textbox
            this.on(select, 'change', this.handleFontChange.bind(this));

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
            close.setAttribute('href', '#');
            close.className = 'medium-editor-toobar-close';
            close.innerHTML = this.getEditorOption('buttonLabels') === 'fontawesome' ?
                              '<i class="fa fa-times"></i>' :
                              '&times;';
            form.appendChild(close);

            // Handle close button clicks
            this.on(close, 'click', this.handleCloseClick.bind(this));

            return form;
        },

        getSelect: function () {
            return this.getForm().querySelector('select.medium-editor-toolbar-select-font-name');
        },

        clearFontName: function () {
            MediumEditor.selection.getSelectedElements(this.document).forEach(function (el) {
                if (el.nodeName.toLowerCase() === 'span' || el.nodeName.toLowerCase() === 'li') {
                    el.style['font-family'] = '';
                }
            });
        },

        checkForParentLiTag: function (node) {
            if (node.id === this.base.elements[0].id) {
                throw Error('At least one list element should be present !');
            } else if (node.tagName !== 'LI') {
                return this.checkForParentLiTag(node.parentNode);
            } else {
                return node;
            }
        },

        handleFontChange: function () {
            var font = this.getSelect().value;
            if (font === '') {
                this.clearFontName();
            } else {
                //this.execAction('fontName', { name: font });
                var range = MediumEditor.selection.getSelectionRange(this.document),
                node = MediumEditor.selection.getSelectedParentElement(range),
                endNode = range.endContainer.parentNode,
                textSelected = this.document.getSelection().toString(),
                startNode = node !== endNode ? this.checkForParentLiTag(node) : node,
                parentText = startNode.innerText.replace(/\n$/, '');

                if (textSelected === parentText) {
                    this.unwrapFontName(startNode);
                    startNode.style['font-family'] = font;
                } else if (textSelected !== parentText) {
                    var isNewLinePresent = this.isMultipleLine(startNode, endNode);
                    if (isNewLinePresent) {
                        this.applySiblingChanges(startNode, endNode, font);
                    } else {
                        this.applyInsertHTML(font, range);
                    }
                }
            }
        },

        unwrapFontName: function (node) {
            var childs = node.getElementsByTagName('span');
            for (var index = 0; index < childs.length; index++) {
                childs[index].style.removeProperty('font-family');
            }
        },

        isMultipleLine: function (startNode, endNode) {
            return (startNode !== endNode);
        },

        applyInsertHTML: function (font, range) {
            this.insertHTML(font, range);
        },

        chunkWrapper: function (range, parent) {
            if (MediumEditor.selection.getSelectedParentElement(range).tagName === parent) {
                return MediumEditor.selection.getSelectedParentElement(range);
            } else {
                var span = this.document.createElement('span');
                span.setAttribute('type', 'di');
                return span;
            }
        },

        insertHTML: function (font, range) {
            // var sel, range;
            // if (window.getSelection && (sel = window.getSelection()).rangeCount) {
            //    range = sel.getRangeAt(0);
            var content = range.extractContents();
            range.collapse(true);
            var span = this.chunkWrapper(range, 'span');

            span.style['font-family'] = font;
            span.appendChild(
              this.document.createTextNode(content.textContent)
            );

            range.insertNode(span);
            // Move the caret immediately after the inserted span
            range.setStartAfter(span);
            range.collapse(true);
            this.document.getSelection().removeAllRanges();
            this.document.getSelection().addRange(range);
            //}
        },

        applySiblingChanges: function (startNode, endNode, font) {
            while (startNode !== null) {

                if (startNode.tagName === 'LI') {
                    this.unwrapFontName(startNode);
                    startNode.style['font-family'] = font;
                }
                if (startNode.tagName === 'UL' || startNode.tagName === 'OL') {
                    startNode = startNode.firstElementChild;
                    continue;
                }
                if (startNode === endNode) {
                    break;
                } else if (startNode.nextElementSibling !== null) {
                    startNode = startNode.nextElementSibling;
                } else {
                    startNode = startNode.parentNode.nextElementSibling;
                }
            }
        },

        handleFormClick: function (event) {
            // make sure not to hide form when clicking inside the form
            event.stopPropagation();
        },

        handleSaveClick: function (event) {
            // Clicking Save -> create the font size
            event.preventDefault();
            this.doFormSave();
        },

        handleCloseClick: function (event) {
            // Click Close -> close the form
            event.preventDefault();
            this.doFormCancel();
        }
    });

    MediumEditor.extensions.fontName = FontNameForm;
}());
