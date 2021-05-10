const { EventEmitter } = require('events');
const inputListClass = '.input-list';

class FileInput extends EventEmitter {
    files = [];

    constructor(inputContainer) {
        super();
        this.inputContainer = inputContainer;
        this.fileInput = inputContainer.querySelector('input[type="file"]');
        this.acceptedTypes = this.fileInput.accept ? this.fileInput.accept.split(',') : null;
        this.inputList = inputContainer.querySelector(inputListClass)
            || inputContainer.parentElement.querySelector(`#${inputContainer.id} + ${inputListClass}`);
        
        this.setupListeners();
    }

    setupListeners() {
        this.fileInput.onchange = () => {
            var blocked = false;
            const inputFiles = this.fileInput.files;
            for (let i = 0; i < inputFiles.length; i++) {
                let folder = false;
                let file = inputFiles[i];
                if (this.acceptedTypes && !this.acceptedTypes.includes(file.type)) {
                    blocked = true;
                    continue;
                }

                if (file.webkitRelativePath) {
                    const directoryPath = file.path.replace(file.webkitRelativePath, '');
                    file = new File([new Blob(['folder'])], directoryPath);
                    folder = true;
                    this.inputList.innerHTML = '';
                    this.files = [];
                }

                const fileElement = this.createFileElement(file);
                this.inputList.appendChild(fileElement);
        
                this.files.push(file);

                // If this input is being used to select a folder, only include one file in that folder
                // By ignoring all other files
                if (folder) {
                    break;
                }
            }
            this.emit('change', this.files);
            if (blocked) alert(`Some files have been blocked due to improper type. 
                (Only accepting ${this.acceptedTypes.join(', ')} files)`);
        }
    }

    createFileElement(file) {
        var textElement = document.createElement('div');
        var element = document.createElement('li');
        textElement.textContent = file.name;
        textElement.alt = file.name;
        element.appendChild(textElement);
        element.className = 'generated';
        element.addEventListener('click', () => {
            this.files.splice(this.files.indexOf(file), 1);
            this.inputList.removeChild(element);
            this.fileInput.value = '';
            this.emit('change', this.files);
        });
        return element;
    }
}

module.exports = {
    FileInput,
}
