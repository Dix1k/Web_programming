let selectedTool = 'select';
let selectedElement = null;
let elements = [];
let elementIdCounter = 0;
let isDrawing = false;
let isDragging = false;
let startX, startY;
let currentColor = '#4262FF';
let currentFillColor = 'transparent';
let currentBorderWidth = 2;
let currentFontSize = 16;
let currentBoardId = null;

const boardCanvas = document.getElementById('board-canvas');
const canvasContainer = document.getElementById('canvasContainer');
const selectTool = document.getElementById('selectTool');
const rectangleTool = document.getElementById('rectangleTool');
const circleTool = document.getElementById('circleTool');
const textTool = document.getElementById('textTool');
const lineTool = document.getElementById('lineTool');
const arrowTool = document.getElementById('arrowTool');
const deleteTool = document.getElementById('deleteTool');
const fillColors = document.querySelectorAll('#fillColors .color-option');
const borderColors = document.querySelectorAll('#borderColors .color-option');
const borderWidthSlider = document.getElementById('borderWidth');
const borderWidthValue = document.getElementById('borderWidthValue');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const clearBtn = document.getElementById('clearBtn');
const shareBtn = document.getElementById('shareBtn');
const newBoardBtn = document.getElementById('newBoardBtn');
const bringForwardBtn = document.getElementById('bringForwardBtn');
const sendBackwardBtn = document.getElementById('sendBackwardBtn');
const boardIdDisplay = document.getElementById('boardIdDisplay');

const loadModal = document.getElementById('loadModal');
const shareModal = document.getElementById('shareModal');
const closeButtons = document.querySelectorAll('.close-modal');

async function init() {
    await createNewBoard();

    selectTool.addEventListener('click', () => setActiveTool('select'));
    rectangleTool.addEventListener('click', () => setActiveTool('rectangle'));
    circleTool.addEventListener('click', () => setActiveTool('circle'));
    textTool.addEventListener('click', () => setActiveTool('text'));
    lineTool.addEventListener('click', () => setActiveTool('line'));
    arrowTool.addEventListener('click', () => setActiveTool('arrow'));
    deleteTool.addEventListener('click', deleteSelectedElement);

    fillColors.forEach(color => {
        color.addEventListener('click', () => {
            fillColors.forEach(c => c.classList.remove('active'));
            color.classList.add('active');
            currentFillColor = color.getAttribute('data-color');
            updateSelectedElementStyle();
        });
    });

    borderColors.forEach(color => {
        color.addEventListener('click', () => {
            borderColors.forEach(c => c.classList.remove('active'));
            color.classList.add('active');
            currentColor = color.getAttribute('data-color');
            updateSelectedElementStyle();
        });
    });

    borderWidthSlider.addEventListener('input', () => {
        currentBorderWidth = borderWidthSlider.value;
        borderWidthValue.textContent = currentBorderWidth + 'px';
        updateSelectedElementStyle();
    });
    
    fontSizeSlider.addEventListener('input', () => {
        currentFontSize = fontSizeSlider.value;
        fontSizeValue.textContent = currentFontSize + 'px';
        updateSelectedElementStyle();
    });

    saveBtn.addEventListener('click', saveBoard);
    loadBtn.addEventListener('click', showLoadModal);
    clearBtn.addEventListener('click', clearBoard);
    shareBtn.addEventListener('click', showShareModal);
    newBoardBtn.addEventListener('click', createNewBoard);
    bringForwardBtn.addEventListener('click', () => changeElementZIndex(1));
    sendBackwardBtn.addEventListener('click', () => changeElementZIndex(-1));

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            loadModal.style.display = 'none';
            shareModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === loadModal) loadModal.style.display = 'none';
        if (e.target === shareModal) shareModal.style.display = 'none';
    });

    boardCanvas.addEventListener('mousedown', handleCanvasMouseDown);
    boardCanvas.addEventListener('mousemove', handleCanvasMouseMove);
    boardCanvas.addEventListener('mouseup', handleCanvasMouseUp);
    boardCanvas.addEventListener('dblclick', handleCanvasDoubleClick);

    createDefaultElements();

    setInterval(autoSave, 30000);
}

async function createNewBoard() {
    try {
        const response = await fetch('/api/create-board', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentBoardId = data.boardId;
            boardIdDisplay.textContent = `ID: ${currentBoardId.substring(0, 8)}...`;
            boardIdDisplay.title = `Нажмите чтобы скопировать ID: ${currentBoardId}`;

            elements = [];
            elementIdCounter = 0;
            boardCanvas.innerHTML = '';
            
            showNotification('Новая доска создана!', 'success');
        }
    } catch (error) {
        console.error('Error creating new board:', error);
        showNotification('Ошибка при создании доски', 'error');
    }
}

function setActiveTool(tool) {
    selectedTool = tool;
    
    const tools = document.querySelectorAll('.tool');
    tools.forEach(t => t.classList.remove('active'));
    
    switch(tool) {
        case 'select': selectTool.classList.add('active'); break;
        case 'rectangle': rectangleTool.classList.add('active'); break;
        case 'circle': circleTool.classList.add('active'); break;
        case 'text': textTool.classList.add('active'); break;
        case 'line': lineTool.classList.add('active'); break;
        case 'arrow': arrowTool.classList.add('active'); break;
    }

    if (tool !== 'select') {
        deselectElement();
    }
}

function handleCanvasMouseDown(e) {
    startX = e.clientX - boardCanvas.getBoundingClientRect().left + canvasContainer.scrollLeft;
    startY = e.clientY - boardCanvas.getBoundingClientRect().top + canvasContainer.scrollTop;
    
    if (selectedTool === 'select' && e.target !== boardCanvas) {
        if (e.target.classList.contains('shape') || e.target.classList.contains('text-box')) {
            selectElement(e.target);
            isDragging = true;
            return;
        }
    }

    if (e.target === boardCanvas) {
        deselectElement();
    }

    if (selectedTool !== 'select' && selectedTool !== 'delete') {
        isDrawing = true;
    }
}

function handleCanvasMouseMove(e) {
    if (!isDrawing && !isDragging) return;
    
    const currentX = e.clientX - boardCanvas.getBoundingClientRect().left + canvasContainer.scrollLeft;
    const currentY = e.clientY - boardCanvas.getBoundingClientRect().top + canvasContainer.scrollTop;
    
    if (isDragging && selectedElement) {
        const dx = currentX - startX;
        const dy = currentY - startY;
        
        const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
        if (elementData) {
            elementData.x += dx;
            elementData.y += dy;
            
            selectedElement.style.left = elementData.x + 'px';
            selectedElement.style.top = elementData.y + 'px';

            startX = currentX;
            startY = currentY;
        }
    }
}

function handleCanvasMouseUp() {
    if (isDrawing && selectedTool !== 'select') {
        const endX = event.clientX - boardCanvas.getBoundingClientRect().left + canvasContainer.scrollLeft;
        const endY = event.clientY - boardCanvas.getBoundingClientRect().top + canvasContainer.scrollTop;

        createNewElement(startX, startY, endX, endY);
        isDrawing = false;
    }
    
    isDragging = false;
}

function handleCanvasDoubleClick(e) {
    if (selectedTool === 'text' && e.target === boardCanvas) {
        const x = e.clientX - boardCanvas.getBoundingClientRect().left + canvasContainer.scrollLeft;
        const y = e.clientY - boardCanvas.getBoundingClientRect().top + canvasContainer.scrollTop;
        
        createTextElement(x, y);
    }
}

function createNewElement(startX, startY, endX, endY) {
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    
    let element;
    
    switch(selectedTool) {
        case 'rectangle':
            element = createRectangle(x, y, width, height);
            break;
        case 'circle':
            const size = Math.max(width, height);
            element = createCircle(x, y, size);
            break;
        case 'line':
            element = createLine(startX, startY, endX, endY);
            break;
        case 'arrow':
            element = createArrowSVG(startX, startY, endX, endY);
            break;
    }
    
    if (element) {
        elementIdCounter++;
        const elementData = {
            id: elementIdCounter,
            type: selectedTool,
            x: parseInt(element.style.left),
            y: parseInt(element.style.top),
            width: parseInt(element.style.width) || 0,
            height: parseInt(element.style.height) || 0,
            color: currentColor,
            fillColor: currentFillColor,
            borderWidth: currentBorderWidth,
            fontSize: currentFontSize,
            content: element.textContent || '',
            zIndex: elements.length,
            endX: endX,
            endY: endY
        };
        
        elements.push(elementData);
        element.dataset.id = elementIdCounter;

        selectElement(element);
    }
}

function createRectangle(x, y, width, height) {
    if (width < 10 || height < 10) {
        width = 100;
        height = 80;
    }
    
    const rect = document.createElement('div');
    rect.className = 'shape rectangle';
    rect.style.left = x + 'px';
    rect.style.top = y + 'px';
    rect.style.width = width + 'px';
    rect.style.height = height + 'px';
    rect.style.borderColor = currentColor;
    rect.style.borderWidth = currentBorderWidth + 'px';
    rect.style.backgroundColor = currentFillColor;
    rect.style.zIndex = elements.length;
    
    boardCanvas.appendChild(rect);
    return rect;
}

function createCircle(x, y, size) {
    if (size < 10) size = 80;
    
    const circle = document.createElement('div');
    circle.className = 'shape circle';
    circle.style.left = x + 'px';
    circle.style.top = y + 'px';
    circle.style.width = size + 'px';
    circle.style.height = size + 'px';
    circle.style.borderColor = currentColor;
    circle.style.borderWidth = currentBorderWidth + 'px';
    circle.style.backgroundColor = currentFillColor;
    circle.style.zIndex = elements.length;
    
    boardCanvas.appendChild(circle);
    return circle;
}

function createLine(startX, startY, endX, endY) {
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    if (length < 10) return null;
    
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    const line = document.createElement('div');
    line.className = 'shape line';
    line.style.left = startX + 'px';
    line.style.top = startY + 'px';
    line.style.width = length + 'px';
    line.style.height = currentBorderWidth + 'px';
    line.style.backgroundColor = currentColor;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.zIndex = elements.length;
    
    boardCanvas.appendChild(line);
    return line;
}

function createArrowSVG(startX, startY, endX, endY) {
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    if (length < 10) return null;
    
    const svgNS = "http://www.w3.org/2000/svg";
    const arrow = document.createElementNS(svgNS, "svg");
    arrow.setAttribute("class", "shape arrow-svg");
    arrow.style.position = "absolute";
    arrow.style.left = Math.min(startX, endX) + "px";
    arrow.style.top = Math.min(startY, endY) + "px";
    arrow.style.width = Math.abs(endX - startX) + "px";
    arrow.style.height = Math.abs(endY - startY) + "px";
    arrow.style.zIndex = elements.length;
    arrow.style.overflow = "visible";

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", startX < endX ? "0" : Math.abs(endX - startX));
    line.setAttribute("y1", startY < endY ? "0" : Math.abs(endY - startY));
    line.setAttribute("x2", startX < endX ? Math.abs(endX - startX) : "0");
    line.setAttribute("y2", startY < endY ? Math.abs(endY - startY) : "0");
    line.setAttribute("stroke", currentColor);
    line.setAttribute("stroke-width", currentBorderWidth);
    line.setAttribute("marker-end", "url(#arrowhead)");

    const defs = document.createElementNS(svgNS, "defs");
    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    
    const polygon = document.createElementNS(svgNS, "polygon");
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", currentColor);
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    arrow.appendChild(defs);
    arrow.appendChild(line);
    
    boardCanvas.appendChild(arrow);
    
    return arrow;
}

function updateSelectedElementStyle() {
    if (!selectedElement) return;
    
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;

    elementData.color = currentColor;
    elementData.fillColor = currentFillColor;
    elementData.borderWidth = currentBorderWidth;
    elementData.fontSize = currentFontSize;

    if (selectedElement.classList.contains('rectangle') || selectedElement.classList.contains('circle')) {
        selectedElement.style.borderColor = currentColor;
        selectedElement.style.borderWidth = currentBorderWidth + 'px';
        selectedElement.style.backgroundColor = currentFillColor;
    } else if (selectedElement.classList.contains('line')) {
        selectedElement.style.backgroundColor = currentColor;
        selectedElement.style.height = currentBorderWidth + 'px';
    } else if (selectedElement.classList.contains('arrow')) {
        const arrowLine = selectedElement.querySelector('.arrow-line');
        const arrowHead = selectedElement.querySelector('.arrow-head');
        
        if (arrowLine) {
            arrowLine.style.backgroundColor = currentColor;
            arrowLine.style.height = currentBorderWidth + 'px';
        }
        
        if (arrowHead) {
            arrowHead.style.borderTopColor = currentColor;
            const borderWidth = Math.max(3, currentBorderWidth);
            arrowHead.style.borderLeft = `${borderWidth * 1.5}px solid transparent`;
            arrowHead.style.borderRight = `${borderWidth * 1.5}px solid transparent`;
            arrowHead.style.borderTop = `${borderWidth * 2.5}px solid ${currentColor}`;
        }
    } else if (selectedElement.classList.contains('text-box')) {
        selectedElement.style.color = currentColor;
        selectedElement.style.fontSize = currentFontSize + 'px';
    }
}

function createTextElement(x, y) {
    const textArea = document.createElement('textarea');
    textArea.className = 'shape text-box';
    textArea.style.left = x + 'px';
    textArea.style.top = y + 'px';
    textArea.style.width = '200px';
    textArea.style.height = 'auto';
    textArea.style.color = currentColor;
    textArea.style.fontSize = currentFontSize + 'px';
    textArea.style.zIndex = elements.length;
    textArea.placeholder = 'Введите текст...';
    
    textArea.addEventListener('blur', function() {
        const elementData = elements.find(el => el.id === parseInt(this.dataset.id));
        if (elementData) {
            elementData.content = this.value;
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
            elementData.height = this.scrollHeight;
        }
    });
    
    textArea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
    
    boardCanvas.appendChild(textArea);
    
    elementIdCounter++;
    const elementData = {
        id: elementIdCounter,
        type: 'text',
        x: x,
        y: y,
        width: 200,
        height: textArea.scrollHeight,
        color: currentColor,
        fillColor: 'transparent',
        borderWidth: 0,
        fontSize: currentFontSize,
        content: '',
        zIndex: elements.length
    };
    
    elements.push(elementData);
    textArea.dataset.id = elementIdCounter;

    selectElement(textArea);
    textArea.focus();
    
    return textArea;
}

function selectElement(element) {
    deselectElement();
    
    selectedElement = element;
    element.classList.add('selected');

    updatePropertiesPanel();
}

function deselectElement() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement = null;
    }
}

function updatePropertiesPanel() {
    if (!selectedElement) return;
    
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;
    
    fillColors.forEach(color => {
        if (color.getAttribute('data-color') === elementData.fillColor) {
            color.classList.add('active');
        } else {
            color.classList.remove('active');
        }
    });
    
    borderColors.forEach(color => {
        if (color.getAttribute('data-color') === elementData.color) {
            color.classList.add('active');
        } else {
            color.classList.remove('active');
        }
    });
    
    borderWidthSlider.value = elementData.borderWidth;
    borderWidthValue.textContent = elementData.borderWidth + 'px';
    currentBorderWidth = elementData.borderWidth;
    
    if (elementData.type === 'text') {
        fontSizeSlider.value = elementData.fontSize;
        fontSizeValue.textContent = elementData.fontSize + 'px';
        currentFontSize = elementData.fontSize;
    }
}

function updateSelectedElementStyle() {
    if (!selectedElement) return;
    
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;
    
    elementData.color = currentColor;
    elementData.fillColor = currentFillColor;
    elementData.borderWidth = currentBorderWidth;
    elementData.fontSize = currentFontSize;
    
    if (selectedElement.classList.contains('rectangle') || selectedElement.classList.contains('circle')) {
        selectedElement.style.borderColor = currentColor;
        selectedElement.style.borderWidth = currentBorderWidth + 'px';
        selectedElement.style.backgroundColor = currentFillColor;
    } else if (selectedElement.classList.contains('line')) {
        selectedElement.style.backgroundColor = currentColor;
        selectedElement.style.height = currentBorderWidth + 'px';
    } else if (selectedElement.classList.contains('arrow')) {
        const arrowLine = selectedElement.querySelector('.arrow-line');
        const arrowHead = selectedElement.querySelector('.arrow-head');
        
        if (arrowLine) {
            arrowLine.style.backgroundColor = currentColor;
            arrowLine.style.height = currentBorderWidth + 'px';
        }
        
        if (arrowHead) {
            arrowHead.style.borderTopColor = currentColor;
        }
    } else if (selectedElement.classList.contains('text-box')) {
        selectedElement.style.color = currentColor;
        selectedElement.style.fontSize = currentFontSize + 'px';
    }
}

function deleteSelectedElement() {
    if (!selectedElement) return;
    
    const elementId = parseInt(selectedElement.dataset.id);

    selectedElement.remove();
    
    elements = elements.filter(el => el.id !== elementId);
    
    selectedElement = null;
}

function changeElementZIndex(direction) {
    if (!selectedElement) return;
    
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;
    
    elementData.zIndex += direction;
    selectedElement.style.zIndex = elementData.zIndex;
}

async function saveBoard() {
    if (!currentBoardId) {
        await createNewBoard();
    }
    
    try {
        const response = await fetch('/api/save-board', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                boardId: currentBoardId,
                elements: elements
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Доска сохранена!', 'success');
        } else {
            showNotification('Ошибка при сохранении доски', 'error');
        }
    } catch (error) {
        console.error('Error saving board:', error);
        showNotification('Ошибка при сохранении доски', 'error');
    }
}

function autoSave() {
    if (currentBoardId && elements.length > 0) {
        saveBoard();
        console.log('Auto-saved board');
    }
}

async function loadBoard(boardId) {
    try {
        const response = await fetch(`/api/load-board/${boardId}`);
        const data = await response.json();
        
        if (data.success) {
            currentBoardId = boardId;
            boardIdDisplay.textContent = `ID: ${boardId.substring(0, 8)}...`;
            boardIdDisplay.title = `Нажмите чтобы скопировать ID: ${boardId}`;
            
            elements = data.elements || [];
            elementIdCounter = elements.length > 0 ? Math.max(...elements.map(e => e.id)) : 0;
            
            boardCanvas.innerHTML = '';
            
            elements.forEach(elementData => {
                let element;
                
                switch(elementData.type) {
                    case 'rectangle':
                        element = createRectangle(
                            elementData.x, 
                            elementData.y, 
                            elementData.width, 
                            elementData.height
                        );
                        break;
                    case 'circle':
                        element = createCircle(
                            elementData.x, 
                            elementData.y, 
                            elementData.width
                        );
                        break;
                    case 'line':
                        element = createLine(
                            elementData.x, 
                            elementData.y, 
                            elementData.endX || elementData.x + elementData.width, 
                            elementData.endY || elementData.y
                        );
                        break;
                    case 'arrow':
                        element = createArrowSVGForLoad(
                            elementData.x, 
                            elementData.y, 
                            elementData.endX || elementData.x + elementData.width, 
                            elementData.endY || elementData.y,
                            elementData
                        );
                        break;
                    case 'text':
                        element = document.createElement('textarea');
                        element.className = 'shape text-box';
                        element.style.left = elementData.x + 'px';
                        element.style.top = elementData.y + 'px';
                        element.style.width = elementData.width + 'px';
                        element.style.height = elementData.height + 'px';
                        element.style.color = elementData.color;
                        element.style.fontSize = elementData.fontSize + 'px';
                        element.style.zIndex = elementData.zIndex;
                        element.value = elementData.content;
                        element.placeholder = 'Введите текст...';
                        
                        element.addEventListener('blur', function() {
                            const elData = elements.find(el => el.id === parseInt(this.dataset.id));
                            if (elData) {
                                elData.content = this.value;
                                this.style.height = 'auto';
                                this.style.height = this.scrollHeight + 'px';
                                elData.height = this.scrollHeight;
                            }
                        });
                        
                        element.addEventListener('input', function() {
                            this.style.height = 'auto';
                            this.style.height = this.scrollHeight + 'px';
                        });
                        
                        boardCanvas.appendChild(element);
                        break;
                }
                
                if (element && elementData.type !== 'text' && elementData.type !== 'arrow') {
                    if (elementData.type === 'rectangle' || elementData.type === 'circle') {
                        element.style.borderColor = elementData.color;
                        element.style.borderWidth = elementData.borderWidth + 'px';
                        element.style.backgroundColor = elementData.fillColor;
                    } else if (elementData.type === 'line') {
                        element.style.backgroundColor = elementData.color;
                        element.style.height = elementData.borderWidth + 'px';
                    }
                    
                    element.style.zIndex = elementData.zIndex;
                    element.dataset.id = elementData.id;
                } else if (element && elementData.type === 'arrow') {
                    element.dataset.id = elementData.id;
                }
            });
            
            loadModal.style.display = 'none';
            showNotification('Доска загружена!', 'success');
        } else {
            showNotification('Доска не найдена', 'error');
        }
    } catch (error) {
        console.error('Error loading board:', error);
        showNotification('Ошибка при загрузке доски', 'error');
    }
}

function createArrowSVGForLoad(startX, startY, endX, endY, elementData) {
    const svgNS = "http://www.w3.org/2000/svg";
    const arrow = document.createElementNS(svgNS, "svg");
    arrow.setAttribute("class", "shape arrow-svg");
    arrow.style.position = "absolute";
    arrow.style.left = Math.min(startX, endX) + "px";
    arrow.style.top = Math.min(startY, endY) + "px";
    arrow.style.width = Math.abs(endX - startX) + "px";
    arrow.style.height = Math.abs(endY - startY) + "px";
    arrow.style.zIndex = elementData.zIndex;
    arrow.style.overflow = "visible";
    arrow.dataset.id = elementData.id;

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", startX < endX ? "0" : Math.abs(endX - startX));
    line.setAttribute("y1", startY < endY ? "0" : Math.abs(endY - startY));
    line.setAttribute("x2", startX < endX ? Math.abs(endX - startX) : "0");
    line.setAttribute("y2", startY < endY ? Math.abs(endY - startY) : "0");
    line.setAttribute("stroke", elementData.color);
    line.setAttribute("stroke-width", elementData.borderWidth);
    line.setAttribute("marker-end", `url(#arrowhead-${elementData.id})`);

    const defs = document.createElementNS(svgNS, "defs");
    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id", `arrowhead-${elementData.id}`);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    
    const polygon = document.createElementNS(svgNS, "polygon");
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", elementData.color);
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    arrow.appendChild(defs);
    arrow.appendChild(line);
    
    boardCanvas.appendChild(arrow);

    arrow.addEventListener('mousedown', function(e) {
        if (selectedTool === 'select') {
            selectElement(this);
            isDragging = true;
            startX = e.clientX - boardCanvas.getBoundingClientRect().left + canvasContainer.scrollLeft;
            startY = e.clientY - boardCanvas.getBoundingClientRect().top + canvasContainer.scrollTop;
            e.stopPropagation();
        }
    });
    
    return arrow;
}

function createArrowSVG(startX, startY, endX, endY) {
    const svgNS = "http://www.w3.org/2000/svg";
    const arrow = document.createElementNS(svgNS, "svg");
    arrow.setAttribute("class", "shape arrow-svg");
    arrow.style.position = "absolute";
    arrow.style.left = Math.min(startX, endX) + "px";
    arrow.style.top = Math.min(startY, endY) + "px";
    arrow.style.width = Math.abs(endX - startX) + "px";
    arrow.style.height = Math.abs(endY - startY) + "px";
    arrow.style.zIndex = elements.length;
    arrow.style.overflow = "visible";

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", startX < endX ? "0" : Math.abs(endX - startX));
    line.setAttribute("y1", startY < endY ? "0" : Math.abs(endY - startY));
    line.setAttribute("x2", startX < endX ? Math.abs(endX - startX) : "0");
    line.setAttribute("y2", startY < endY ? Math.abs(endY - startY) : "0");
    line.setAttribute("stroke", currentColor);
    line.setAttribute("stroke-width", currentBorderWidth);
    line.setAttribute("marker-end", "url(#arrowhead-new)");

    const defs = document.createElementNS(svgNS, "defs");
    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id", "arrowhead-new");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    
    const polygon = document.createElementNS(svgNS, "polygon");
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", currentColor);
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    arrow.appendChild(defs);
    arrow.appendChild(line);
    
    boardCanvas.appendChild(arrow);

    arrow.addEventListener('mousedown', function(e) {
        if (selectedTool === 'select') {
            selectElement(this);
            isDragging = true;
            startX = e.clientX - boardCanvas.getBoundingClientRect().left + canvasContainer.scrollLeft;
            startY = e.clientY - boardCanvas.getBoundingClientRect().top + canvasContainer.scrollTop;
            e.stopPropagation();
        }
    });
    
    return arrow;
}

function selectElement(element) {
    deselectElement();
    
    selectedElement = element;
    element.classList.add('selected');

    if (element.tagName === 'svg') {
        element.style.outline = '2px dashed #4262FF';
        element.style.outlineOffset = '2px';
    }

    updatePropertiesPanel();
}

function deselectElement() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');

        if (selectedElement.tagName === 'svg') {
            selectedElement.style.outline = 'none';
        }
        
        selectedElement = null;
    }
}

function updateSelectedElementStyle() {
    if (!selectedElement) return;
    
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;

    elementData.color = currentColor;
    elementData.borderWidth = currentBorderWidth;

    if (selectedElement.classList.contains('rectangle') || selectedElement.classList.contains('circle')) {
        selectedElement.style.borderColor = currentColor;
        selectedElement.style.borderWidth = currentBorderWidth + 'px';
        selectedElement.style.backgroundColor = currentFillColor;
        elementData.fillColor = currentFillColor;
    } else if (selectedElement.classList.contains('line')) {
        selectedElement.style.backgroundColor = currentColor;
        selectedElement.style.height = currentBorderWidth + 'px';
    } else if (selectedElement.tagName === 'svg' && selectedElement.classList.contains('arrow-svg')) {
        const line = selectedElement.querySelector('line');
        const polygon = selectedElement.querySelector('polygon');
        
        if (line) {
            line.setAttribute('stroke', currentColor);
            line.setAttribute('stroke-width', currentBorderWidth);
        }
        
        if (polygon) {
            polygon.setAttribute('fill', currentColor);
        }

        const markerId = `arrowhead-${elementData.id}`;
        const marker = selectedElement.querySelector('marker');
        if (marker) {
            marker.setAttribute('id', markerId);
        }
        
        if (line) {
            line.setAttribute('marker-end', `url(#${markerId})`);
        }
    } else if (selectedElement.classList.contains('text-box')) {
        selectedElement.style.color = currentColor;
        selectedElement.style.fontSize = currentFontSize + 'px';
        elementData.fontSize = currentFontSize;
    }
}

function updatePropertiesPanel() {
    if (!selectedElement) return;
    
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;

    borderColors.forEach(color => {
        if (color.getAttribute('data-color') === elementData.color) {
            color.classList.add('active');
        } else {
            color.classList.remove('active');
        }
    });

    if (selectedElement.classList.contains('rectangle') || selectedElement.classList.contains('circle')) {
        fillColors.forEach(color => {
            if (color.getAttribute('data-color') === elementData.fillColor) {
                color.classList.add('active');
            } else {
                color.classList.remove('active');
            }
        });
        document.getElementById('fillColors').parentElement.style.display = 'block';
    } else {
        document.getElementById('fillColors').parentElement.style.display = 'none';
    }

    borderWidthSlider.value = elementData.borderWidth;
    borderWidthValue.textContent = elementData.borderWidth + 'px';
    currentBorderWidth = elementData.borderWidth;
    
    if (elementData.type === 'text') {
        fontSizeSlider.value = elementData.fontSize;
        fontSizeValue.textContent = elementData.fontSize + 'px';
        currentFontSize = elementData.fontSize;
        document.getElementById('fontSize').parentElement.style.display = 'block';
    } else {
        document.getElementById('fontSize').parentElement.style.display = 'none';
    }
}

function deleteSelectedElement() {
    if (!selectedElement) return;
    
    const elementId = parseInt(selectedElement.dataset.id);

    selectedElement.remove();

    elements = elements.filter(el => el.id !== elementId);
    
    selectedElement = null;
}

async function showLoadModal() {
    loadModal.style.display = 'flex';
    
    try {
        const response = await fetch('/api/boards');
        const data = await response.json();
        
        const boardsList = document.getElementById('boardsList');
        boardsList.innerHTML = '';
        
        if (data.success && data.boards.length > 0) {
            data.boards.forEach(board => {
                const boardItem = document.createElement('div');
                boardItem.className = 'board-item';
                boardItem.innerHTML = `
                    <div class="board-item-title">Доска ${board.id.substring(0, 8)}...</div>
                    <div class="board-item-meta">
                        <span>${new Date(board.lastUpdated).toLocaleDateString()}</span>
                        <span>${board.elementCount} элементов</span>
                    </div>
                `;
                
                boardItem.addEventListener('click', () => loadBoard(board.id));
                boardsList.appendChild(boardItem);
            });
        } else {
            boardsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Нет сохраненных досок</div>';
        }
    } catch (error) {
        console.error('Error loading boards list:', error);
    }
}

function showShareModal() {
    shareModal.style.display = 'flex';
    
    const shareLinkInput = document.getElementById('shareLinkInput');
    const shareUrl = `${window.location.origin}/?board=${currentBoardId}`;
    shareLinkInput.value = shareUrl;
    
    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        showNotification('Ссылка скопирована в буфер обмена!', 'success');
    });
}

function clearBoard() {
    if (confirm('Вы уверены, что хотите очистить доску? Все несохраненные изменения будут потеряны.')) {
        elements = [];
        elementIdCounter = 0;
        boardCanvas.innerHTML = '';
        deselectElement();  
        showNotification('Доска очищена', 'info');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (type === 'success') {
        notification.style.background = '#06D6A0';
    } else if (type === 'error') {
        notification.style.background = '#FF6B6B';
    } else if (type === 'info') {
        notification.style.background = '#4262FF';
    }
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

boardIdDisplay.addEventListener('click', () => {
    if (currentBoardId) {
        navigator.clipboard.writeText(currentBoardId)
            .then(() => {
                showNotification('ID доски скопирован в буфер обмена!', 'success');
            })
            .catch(err => {
                console.error('Error copying board ID:', err);
                showNotification('Ошибка при копировании ID', 'error');
            });
    }
});

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('board');
    
    if (boardId) {
        setTimeout(() => loadBoard(boardId), 500);
    } else {
        init();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    
    switch(e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); break;
        case 'r': setActiveTool('rectangle'); break;
        case 'c': setActiveTool('circle'); break;
        case 't': setActiveTool('text'); break;
        case 'l': setActiveTool('line'); break;
        case 'a': setActiveTool('arrow'); break;
        case 'delete':
        case 'backspace': deleteSelectedElement(); break;
        case 's':
            if (e.ctrlKey) {
                e.preventDefault();
                saveBoard();
            }
            break;
        case 'n':
            if (e.ctrlKey) {
                e.preventDefault();
                createNewBoard();
            }
            break;
    }
});