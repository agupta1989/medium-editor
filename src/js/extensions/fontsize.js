(function () {
    'use strict';

    var FontSizeForm = MediumEditor.extensions.form.extend({

        name: 'fontsize',
        action: 'fontSize',
        aria: 'increase/decrease font size',
        contentDefault: '<b>A &#8597</b>',
        contentFA: '<i class="fa fa-text-height"></i>',
        size: ['10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '30px', '36px', '48px', '64px', '72px', '80px', '96px'],
        init: function () {
            MediumEditor.extensions.form.prototype.init.apply(this, arguments);
        },

        // Called when the button the toolbar is clicked
        // Overrides ButtonExtension.handleClick
        handleClick: function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (!this.isDisplayed()) {
                // Get fontsize of current selection (convert to string since IE returns this as number)
                var fontSize = this.document.queryCommandValue('fontSize') + '';
                this.showForm(fontSize);
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
            this.getInput().value = '';
        },

        showForm: function (fontSize) {
            var input = this.getInput();

            this.base.saveSelection();
            this.hideToolbarDefaultActions();
            this.getForm().style.display = 'block';
            this.setToolbarPosition();

            input.value = fontSize || '';
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
            this.clearFontSize();
            this.base.checkSelection();
        },

        // form creation and event handling
        createForm: function () {
            var doc = this.document,
                form = doc.createElement('div'),
                select = doc.createElement('select'),
                close = doc.createElement('a'),
                save = doc.createElement('a');

            // Font Size Form (div)
            form.className = 'medium-editor-toolbar-form';
            form.id = 'medium-editor-toolbar-form-fontsize-' + this.getEditorId();

            // Handle clicks on the form itself
            this.on(form, 'click', this.handleFormClick.bind(this));
            for (var i = 0; i<this.size.length; i++) {
                var option = doc.createElement('option');
                option.innerHTML = this.size[i];
                option.value = this.size[i];
                select.appendChild(option);
            }
            // Add font size slider
            //select.setAttribute('type', 'range');
            //input.setAttribute('min', '1');
            //input.setAttribute('max', '7');
            select.className = 'medium-editor-toolbar-select-font-size';
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

        getInput: function () {
            return this.getForm().querySelector('select.medium-editor-toolbar-select-font-size');
        },

        clearFontSize: function () {
            MediumEditor.selection.getSelectedElements(this.document).forEach(function (el) {
                if (el.nodeName.toLowerCase() === 'span' || el.nodeName.toLowerCase() === 'li') {
                    el.style['font-size'] = '';
                }
            });
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
            var size = this.getInput().value,
            range = MediumEditor.selection.getSelectionRange(this.document),
            node = MediumEditor.selection.getSelectedParentElement(range),
            endNode = range.endContainer.parentNode,
            textSelected = this.document.getSelection().toString(),
            startNode = node !== endNode ? this.checkForParentLiTag(node) : node,
            parentText = startNode.innerText.replace(/\n$/, '');

            if (textSelected === parentText) {
                this.unwrapSize(startNode);
                startNode.style['font-size'] = size;
                //startNode = (MediumEditor.util.isListItem(startNode) ? MediumEditor.util.getClosestTag(startNode, 'LI') : startNode);
                // if (startNode) {
                //     this.unwrapSize(startNode);
                //     startNode.style['font-size'] = size;
                // }
            } else if (textSelected !== parentText) {
                var isNewLinePresent = this.isMultipleLine(startNode, endNode);
                if (isNewLinePresent) {
                    this.applySiblingChanges(startNode, endNode, size);
                } else {
                    this.applyInsertHTML(size, range);
                }
            }
        },

        unwrapSize: function (node) {
            var childs = node.getElementsByTagName('span');
            for (var index = 0; index < childs.length; index++) {
                childs[index].style.removeProperty('font-size');
            }
        },

        isMultipleLine: function (startNode, endNode) {
            return (startNode !== endNode);
        },

        applyInsertHTML: function (size, range) {
            this.insertHTML(size, range);
        },

        chunkWrapper: function (range, parent) {
            // if span already present, return it.
            if (MediumEditor.selection.getSelectedParentElement(range).tagName === parent) {
                return MediumEditor.selection.getSelectedParentElement(range);
            } else {
                // else create new span with custom attribute
                var span = this.document.createElement('span');
                span.setAttribute('type', 'di');
                return span;
            }
        },

        insertHTML: function (size, range) {
            //var sel, range;
            //if (window.getSelection && (sel = window.getSelection()).rangeCount) {
            //range = sel.getRangeAt(0);

            var content = range.extractContents();
            range.collapse(true);
            var span = this.chunkWrapper(range, 'span');

            span.style['font-size'] = size;
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

        applySiblingChanges: function (startNode, endNode, size) {
            while (startNode !== null) {

                if (startNode.tagName === 'LI') {
                    this.unwrapSize(startNode);
                    startNode.style['font-size'] = size;
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

    MediumEditor.extensions.fontSize = FontSizeForm;
}());
