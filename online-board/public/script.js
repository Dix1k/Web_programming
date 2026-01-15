let selectedTool = 'select';
let selectedElement = null;
let elements = [];
let elementIdCounter = 0;
let isDrawing = false;
let isDragging = false;
let isResizing = false;
let startX, startY;
let currentColor = '#4262FF';
let currentFillColor = 'transparent';
let currentBorderWidth = 2;
let currentFontSize = 16;
let currentBoardId = null;
let currentZoom = 1;
let viewportX = 0;
let viewportY = 0;
let socket = null;
let userId = null;
let socketId = null;
let remoteCursors = {};
let resizeDirection = null;
let previewElement = null;
let mouseX = 0;
let mouseY = 0;

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
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomPercent = document.getElementById('zoomPercent');
const usersOnline = document.getElementById('usersOnline');

const loadModal = document.getElementById('loadModal');
const shareModal = document.getElementById('shareModal');
const closeButtons = document.querySelectorAll('.close-modal');

function init() {
    connectSocket();
    setupEventListeners();
    updateCanvasTransform();
    setInterval(autoSave, 30000);
}

function connectSocket() {
    socket = io();
    
    socket.on('connect', () => {
        socketId = socket.id;
        if (currentBoardId) {
            socket.emit('join-board', currentBoardId);
        }
    });
    
    socket.on('board-data', (data) => {
        elements = data.elements || [];
        elementIdCounter = elements.length > 0 ? Math.max(...elements.map(e => e.id)) : 0;
        userId = data.userId;
        currentZoom = data.viewport?.zoom || 1;
        viewportX = data.viewport?.x || 0;
        viewportY = data.viewport?.y || 0;
        
        boardCanvas.innerHTML = '';
        updateRemoteCursors(data.users || {});
        updateUsersOnline(data.users || {});
        renderElements();
        updateCanvasTransform();
    });
    
    socket.on('user-joined', (data) => {
        addRemoteCursor(data.userId, data.userData);
        updateUsersOnline();
    });
    
    socket.on('user-left', (leftUserId) => {
        removeRemoteCursor(leftUserId);
        updateUsersOnline();
    });
    
    socket.on('element-created', (element) => {
        if (!elements.find(el => el.id === element.id)) {
            elements.push(element);
            renderElement(element);
        }
    });
    
    socket.on('element-updated', (data) => {
        const element = elements.find(el => el.id === data.elementId);
        if (element) {
            Object.assign(element, data.updates);
            updateElementVisual(element);
        }
    });
    
    socket.on('element-deleted', (elementId) => {
        elements = elements.filter(el => el.id !== elementId);
        const elementEl = boardCanvas.querySelector(`[data-id="${elementId}"]`);
        if (elementEl) {
            elementEl.remove();
        }
        if (selectedElement && selectedElement.dataset.id == elementId) {
            deselectElement();
        }
    });
    
    socket.on('cursor-moved', (data) => {
        updateRemoteCursor(data.userId, data.cursor);
    });
    
    socket.on('viewport-changed', (data) => {
        if (data.userId !== socketId) {
            viewportX = data.viewport.x;
            viewportY = data.viewport.y;
            currentZoom = data.viewport.zoom;
            updateCanvasTransform();
            updateZoomDisplay();
        }
    });
}

function setupEventListeners() {
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
    
    zoomOutBtn.addEventListener('click', () => changeZoom(-0.1));
    zoomInBtn.addEventListener('click', () => changeZoom(0.1));
    zoomResetBtn.addEventListener('click', resetZoom);
    
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
    boardCanvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    boardCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    canvasContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const zoomDelta = -e.deltaY * 0.001;
            changeZoom(zoomDelta);
        } else {
            viewportX -= e.deltaX * 0.5 / currentZoom;
            viewportY -= e.deltaY * 0.5 / currentZoom;
            updateCanvasTransform();
            broadcastViewport();
        }
    });
    
    canvasContainer.addEventListener('mousemove', (e) => {
        const rect = boardCanvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) / currentZoom + viewportX;
        mouseY = (e.clientY - rect.top) / currentZoom + viewportY;
        broadcastCursor(mouseX, mouseY);
        
        if (isDrawing && previewElement && (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line' || selectedTool === 'arrow')) {
            const width = mouseX - startX;
            const height = mouseY - startY;
            updatePreviewElement(width, height);
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
            case 'escape':
                deselectElement();
                break;
            case '=':
            case '+':
                if (e.ctrlKey) {
                    e.preventDefault();
                    changeZoom(0.1);
                }
                break;
            case '-':
                if (e.ctrlKey) {
                    e.preventDefault();
                    changeZoom(-0.1);
                }
                break;
            case '0':
                if (e.ctrlKey) {
                    e.preventDefault();
                    resetZoom();
                }
                break;
        }
    });
}

async function createNewBoard() {
    try {
        const response = await fetch('/api/create-board', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentBoardId = data.boardId;
            boardIdDisplay.textContent = `ID: ${currentBoardId.substring(0, 8)}...`;
            boardIdDisplay.title = `Нажмите чтобы скопировать ID: ${currentBoardId}`;
            
            elements = [];
            elementIdCounter = 0;
            boardCanvas.innerHTML = '';
            remoteCursors = {};
            
            if (socket) {
                socket.emit('join-board', currentBoardId);
            }
            
            showNotification('Новая доска создана!', 'success');
        }
    } catch (error) {
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
    
    updatePropertiesPanelForTool();
    
    if (tool !== 'select') {
        deselectElement();
    }
}

function updatePropertiesPanelForTool() {
    const fillColorsSection = document.querySelector('#fillColors').parentElement;
    const borderColorsSection = document.querySelector('#borderColors').parentElement;
    const borderWidthSection = document.querySelector('#borderWidth').parentElement;
    const fontSizeSection = document.querySelector('#fontSize').parentElement;
    const layerButtons = document.querySelectorAll('#bringForwardBtn, #sendBackwardBtn');
    
    fillColorsSection.style.display = 'none';
    borderColorsSection.style.display = 'none';
    borderWidthSection.style.display = 'none';
    fontSizeSection.style.display = 'none';
    layerButtons.forEach(btn => btn.style.display = 'none');
    
    if (selectedTool === 'rectangle' || selectedTool === 'circle') {
        fillColorsSection.style.display = 'block';
        borderColorsSection.style.display = 'block';
        borderWidthSection.style.display = 'block';
        layerButtons.forEach(btn => btn.style.display = 'flex');
    } else if (selectedTool === 'text') {
        fillColorsSection.style.display = 'block';
        borderColorsSection.style.display = 'block';
        borderWidthSection.style.display = 'block';
        fontSizeSection.style.display = 'block';
        layerButtons.forEach(btn => btn.style.display = 'flex');
    } else if (selectedTool === 'line' || selectedTool === 'arrow') {
        borderColorsSection.style.display = 'block';
        borderWidthSection.style.display = 'block';
        layerButtons.forEach(btn => btn.style.display = 'flex');
    } else if (selectedTool === 'select' && selectedElement) {
        const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
        if (elementData) {
            if (elementData.type === 'rectangle' || elementData.type === 'circle') {
                fillColorsSection.style.display = 'block';
                borderColorsSection.style.display = 'block';
                borderWidthSection.style.display = 'block';
                layerButtons.forEach(btn => btn.style.display = 'flex');
            } else if (elementData.type === 'text') {
                fillColorsSection.style.display = 'block';
                borderColorsSection.style.display = 'block';
                borderWidthSection.style.display = 'block';
                fontSizeSection.style.display = 'block';
                layerButtons.forEach(btn => btn.style.display = 'flex');
            } else if (elementData.type === 'line' || elementData.type === 'arrow') {
                borderColorsSection.style.display = 'block';
                borderWidthSection.style.display = 'block';
                layerButtons.forEach(btn => btn.style.display = 'flex');
            }
        }
    }
}

function handleCanvasMouseDown(e) {
    const rect = boardCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / currentZoom + viewportX;
    const y = (e.clientY - rect.top) / currentZoom + viewportY;
    
    startX = x;
    startY = y;
    
    if (selectedTool === 'select') {
        const target = e.target;
        
        if (target.classList.contains('resize-handle')) {
            isResizing = true;
            resizeDirection = target.dataset.direction;
            selectedElement = target.parentElement;
        } else if (target.classList.contains('shape') || target.classList.contains('arrow-svg')) {
            selectElement(target);
            isDragging = true;
        } else if (target === boardCanvas) {
            deselectElement();
        }
        
        e.stopPropagation();
        return;
    } else if (selectedTool === 'text') {
        return;
    } else if (selectedTool !== 'delete' && selectedTool !== 'select') {
        if (e.target === boardCanvas) {
            isDrawing = true;
            createPreviewElement(selectedTool, x, y, 0, 0);
        }
    }
}

function handleCanvasMouseMove(e) {
    const rect = boardCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / currentZoom + viewportX;
    const y = (e.clientY - rect.top) / currentZoom + viewportY;
    
    if (isDragging && selectedElement) {
        const dx = x - startX;
        const dy = y - startY;
        startX = x;
        startY = y;
        
        const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
        if (elementData) {
            elementData.x += dx;
            elementData.y += dy;
            
            selectedElement.style.left = elementData.x + 'px';
            selectedElement.style.top = elementData.y + 'px';
            
            updateResizeHandles();
            
            if (socket && currentBoardId) {
                socket.emit('element-update', {
                    boardId: currentBoardId,
                    elementId: elementData.id,
                    updates: { x: elementData.x, y: elementData.y }
                });
            }
        }
    } else if (isResizing && selectedElement && resizeDirection) {
        const dx = x - startX;
        const dy = y - startY;
        startX = x;
        startY = y;
        
        const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
        if (elementData) {
            let newWidth = elementData.width;
            let newHeight = elementData.height;
            let newX = elementData.x;
            let newY = elementData.y;
            
            switch(resizeDirection) {
                case 'nw':
                    newWidth -= dx;
                    newHeight -= dy;
                    newX += dx;
                    newY += dy;
                    break;
                case 'ne':
                    newWidth += dx;
                    newHeight -= dy;
                    newY += dy;
                    break;
                case 'sw':
                    newWidth -= dx;
                    newHeight += dy;
                    newX += dx;
                    break;
                case 'se':
                    newWidth += dx;
                    newHeight += dy;
                    break;
                case 'n':
                    newHeight -= dy;
                    newY += dy;
                    break;
                case 's':
                    newHeight += dy;
                    break;
                case 'w':
                    newWidth -= dx;
                    newX += dx;
                    break;
                case 'e':
                    newWidth += dx;
                    break;
            }
            
            if (newWidth > 10 && newHeight > 10) {
                elementData.width = newWidth;
                elementData.height = newHeight;
                elementData.x = newX;
                elementData.y = newY;
                
                selectedElement.style.left = newX + 'px';
                selectedElement.style.top = newY + 'px';
                selectedElement.style.width = newWidth + 'px';
                selectedElement.style.height = newHeight + 'px';
                
                if (selectedElement.classList.contains('text-box')) {
                    selectedElement.style.height = 'auto';
                    selectedElement.style.height = selectedElement.scrollHeight + 'px';
                    elementData.height = selectedElement.scrollHeight;
                }
                
                updateResizeHandles();
                
                if (socket && currentBoardId) {
                    socket.emit('element-update', {
                        boardId: currentBoardId,
                        elementId: elementData.id,
                        updates: { 
                            x: newX, 
                            y: newY, 
                            width: newWidth, 
                            height: elementData.height
                        }
                    });
                }
            }
        }
    }
}

function handleCanvasMouseUp(e) {
    if (isDrawing && previewElement) {
        const rect = boardCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / currentZoom + viewportX;
        const y = (e.clientY - rect.top) / currentZoom + viewportY;
        
        const width = x - startX;
        const height = y - startY;
        
        if (Math.abs(width) > 5 && Math.abs(height) > 5) {
            createNewElement(selectedTool, startX, startY, width, height);
        }
        
        if (previewElement) {
            previewElement.remove();
            previewElement = null;
        }
    }
    
    isDrawing = false;
    isDragging = false;
    isResizing = false;
    resizeDirection = null;
}

function handleCanvasDoubleClick(e) {
    if (selectedTool === 'text' && e.target === boardCanvas) {
        const rect = boardCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / currentZoom + viewportX;
        const y = (e.clientY - rect.top) / currentZoom + viewportY;
        
        createTextElement(x, y);
    }
}

function handleCanvasWheel(e) {
    e.preventDefault();
    
    if (e.ctrlKey) {
        const zoomDelta = -e.deltaY * 0.001;
        changeZoom(zoomDelta);
    } else {
        viewportX -= e.deltaX * 0.5 / currentZoom;
        viewportY -= e.deltaY * 0.5 / currentZoom;
        updateCanvasTransform();
        broadcastViewport();
    }
}

function createPreviewElement(type, x, y, width, height) {
    if (selectedTool === 'select' || selectedTool === 'text') {
        return;
    }
    
    previewElement = document.createElement('div');
    previewElement.className = 'preview-element';
    
    switch(type) {
        case 'rectangle':
            previewElement.classList.add('preview-rectangle');
            break;
        case 'circle':
            previewElement.classList.add('preview-circle');
            break;
        case 'line':
        case 'arrow':
            previewElement.classList.add('preview-line');
            break;
    }
    
    previewElement.style.left = x + 'px';
    previewElement.style.top = y + 'px';
    previewElement.style.width = '0px';
    previewElement.style.height = '0px';
    previewElement.style.border = '2px dashed #4262FF';
    previewElement.style.backgroundColor = 'rgba(66, 98, 255, 0.15)';
    
    boardCanvas.appendChild(previewElement);
}

function updatePreviewElement(width, height) {
    if (!previewElement) return;
    
    const absWidth = Math.abs(width);
    const absHeight = Math.abs(height);
    
    if (selectedTool === 'circle') {
        const size = Math.max(absWidth, absHeight);
        previewElement.style.width = size + 'px';
        previewElement.style.height = size + 'px';
        previewElement.style.left = (width < 0 ? startX + width : startX) + 'px';
        previewElement.style.top = (height < 0 ? startY + height : startY) + 'px';
    } else if (selectedTool === 'line' || selectedTool === 'arrow') {
        const angle = Math.atan2(height, width) * 180 / Math.PI;
        const length = Math.sqrt(width * width + height * height);
        previewElement.style.width = length + 'px';
        previewElement.style.transform = `rotate(${angle}deg)`;
        previewElement.style.left = startX + 'px';
        previewElement.style.top = startY + 'px';
    } else if (selectedTool === 'rectangle') {
        previewElement.style.width = absWidth + 'px';
        previewElement.style.height = absHeight + 'px';
        previewElement.style.left = (width < 0 ? startX + width : startX) + 'px';
        previewElement.style.top = (height < 0 ? startY + height : startY) + 'px';
        previewElement.style.transform = 'none';
    }
}

function createNewElement(type, x, y, width, height) {
    const absWidth = Math.abs(width);
    const absHeight = Math.abs(height);
    const finalX = width < 0 ? x + width : x;
    const finalY = height < 0 ? y + height : y;
    
    if (absWidth < 10 || absHeight < 10) return;
    
    let element;
    let elementData;
    
    switch(type) {
        case 'rectangle':
            element = createRectangle(finalX, finalY, absWidth, absHeight);
            break;
        case 'circle':
            const size = Math.max(absWidth, absHeight);
            element = createCircle(finalX, finalY, size);
            break;
        case 'line':
            element = createLine(x, y, x + width, y + height);
            break;
        case 'arrow':
            element = createArrow(x, y, x + width, y + height);
            break;
    }
    
    if (element) {
        elementIdCounter++;
        elementData = {
            id: elementIdCounter,
            type: type,
            x: finalX,
            y: finalY,
            width: absWidth,
            height: absHeight,
            color: currentColor,
            fillColor: currentFillColor,
            borderWidth: currentBorderWidth,
            fontSize: currentFontSize,
            content: '',
            zIndex: elements.length,
            endX: type === 'line' || type === 'arrow' ? x + width : null,
            endY: type === 'line' || type === 'arrow' ? y + height : null
        };
        
        elements.push(elementData);
        element.dataset.id = elementIdCounter;
        
        if (socket && currentBoardId) {
            socket.emit('element-create', {
                boardId: currentBoardId,
                element: elementData
            });
        }
        
        selectElement(element);
    }
}

function createRectangle(x, y, width, height) {
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

function createLine(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    const line = document.createElement('div');
    line.className = 'shape line-element';
    line.style.left = x1 + 'px';
    line.style.top = y1 + 'px';
    line.style.width = length + 'px';
    line.style.height = currentBorderWidth + 'px';
    line.style.backgroundColor = currentColor;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 0';
    line.style.zIndex = elements.length;
    
    boardCanvas.appendChild(line);
    return line;
}

function createArrow(x1, y1, x2, y2) {
    const svgNS = "http://www.w3.org/2000/svg";
    const arrow = document.createElementNS(svgNS, "svg");
    arrow.setAttribute("class", "shape arrow-svg");
    arrow.style.left = Math.min(x1, x2) + "px";
    arrow.style.top = Math.min(y1, y2) + "px";
    arrow.style.width = Math.abs(x2 - x1) + "px";
    arrow.style.height = Math.abs(y2 - y1) + "px";
    arrow.style.zIndex = elements.length;
    arrow.style.overflow = "visible";
    
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1 < x2 ? "0" : Math.abs(x2 - x1));
    line.setAttribute("y1", y1 < y2 ? "0" : Math.abs(y2 - y1));
    line.setAttribute("x2", x1 < x2 ? Math.abs(x2 - x1) : "0");
    line.setAttribute("y2", y1 < y2 ? Math.abs(y2 - y1) : "0");
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

function createTextElement(x, y) {
    const textContainer = document.createElement('div');
    textContainer.className = 'shape text-container';
    textContainer.style.left = x + 'px';
    textContainer.style.top = y + 'px';
    textContainer.style.width = '200px';
    textContainer.style.minHeight = '40px';
    textContainer.style.borderColor = currentColor;
    textContainer.style.borderWidth = currentBorderWidth + 'px';
    textContainer.style.borderStyle = 'solid';
    textContainer.style.backgroundColor = currentFillColor;
    textContainer.style.zIndex = elements.length;
    textContainer.style.padding = '8px';
    textContainer.style.borderRadius = '4px';
    
    const textArea = document.createElement('textarea');
    textArea.className = 'text-box';
    textArea.style.width = '100%';
    textArea.style.height = '100%';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.background = 'transparent';
    textArea.style.resize = 'none';
    textArea.style.overflow = 'hidden';
    textArea.style.color = currentColor;
    textArea.style.fontSize = currentFontSize + 'px';
    textArea.style.fontFamily = 'inherit';
    textArea.style.lineHeight = '1.4';
    textArea.placeholder = 'Введите текст...';
    textArea.value = '';
    
    textArea.addEventListener('blur', function() {
        const elementData = elements.find(el => el.id === parseInt(textContainer.dataset.id));
        if (elementData) {
            elementData.content = this.value;
            adjustTextContainerHeight(textContainer, textArea);
            
            if (socket && currentBoardId) {
                socket.emit('element-update', {
                    boardId: currentBoardId,
                    elementId: elementData.id,
                    updates: { 
                        content: elementData.content,
                        height: textContainer.offsetHeight
                    }
                });
            }
        }
    });
    
    textArea.addEventListener('focus', function() {
        textContainer.classList.add('editing');
    });
    
    textArea.addEventListener('input', function() {
        adjustTextContainerHeight(textContainer, textArea);
    });
    
    textContainer.appendChild(textArea);
    boardCanvas.appendChild(textContainer);
    
    elementIdCounter++;
    const elementData = {
        id: elementIdCounter,
        type: 'text',
        x: x,
        y: y,
        width: 200,
        height: textContainer.offsetHeight,
        color: currentColor,
        fillColor: currentFillColor,
        borderWidth: currentBorderWidth,
        fontSize: currentFontSize,
        content: '',
        zIndex: elements.length
    };
    
    elements.push(elementData);
    textContainer.dataset.id = elementIdCounter;
    
    if (socket && currentBoardId) {
        socket.emit('element-create', {
            boardId: currentBoardId,
            element: elementData
        });
    }
    
    selectElement(textContainer);
    textArea.focus();
    
    return textContainer;
}

function adjustTextContainerHeight(container, textArea) {
    textArea.style.height = 'auto';
    const newHeight = Math.max(40, textArea.scrollHeight);
    textArea.style.height = newHeight + 'px';
    container.style.height = newHeight + 'px';
    
    const elementData = elements.find(el => el.id === parseInt(container.dataset.id));
    if (elementData) {
        elementData.height = newHeight;
    }
}

function selectElement(element) {
    deselectElement();
    
    selectedElement = element;
    element.classList.add('selected');
    
    if (element.tagName === 'svg') {
        element.style.outline = '2px solid #4262FF';
        element.style.outlineOffset = '2px';
    }
    
    addResizeHandles(element);
    updatePropertiesPanelForSelectedElement();
}

function deselectElement() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        
        if (selectedElement.tagName === 'svg') {
            selectedElement.style.outline = 'none';
        }
        
        if (selectedElement.classList.contains('text-container')) {
            selectedElement.classList.remove('editing');
        }
        
        removeResizeHandles();
        selectedElement = null;
    }
    
    if (selectedTool === 'select') {
        const fillColorsSection = document.querySelector('#fillColors').parentElement;
        const borderColorsSection = document.querySelector('#borderColors').parentElement;
        const borderWidthSection = document.querySelector('#borderWidth').parentElement;
        const fontSizeSection = document.querySelector('#fontSize').parentElement;
        const layerButtons = document.querySelectorAll('#bringForwardBtn, #sendBackwardBtn');
        
        fillColorsSection.style.display = 'none';
        borderColorsSection.style.display = 'none';
        borderWidthSection.style.display = 'none';
        fontSizeSection.style.display = 'none';
        layerButtons.forEach(btn => btn.style.display = 'none');
    }
}

function addResizeHandles(element) {
    const elementData = elements.find(el => el.id === parseInt(element.dataset.id));
    if (!elementData) return;
    
    let handles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
    
    handles.forEach(direction => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${direction}`;
        handle.dataset.direction = direction;
        element.appendChild(handle);
    });
}

function updateResizeHandles() {
    if (!selectedElement) return;
    
    const handles = selectedElement.querySelectorAll('.resize-handle');
    handles.forEach(handle => handle.remove());
    addResizeHandles(selectedElement);
}

function removeResizeHandles() {
    if (!selectedElement) return;
    
    const handles = selectedElement.querySelectorAll('.resize-handle');
    handles.forEach(handle => handle.remove());
}

function updatePropertiesPanelForSelectedElement() {
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;
    
    const fillColorsSection = document.querySelector('#fillColors').parentElement;
    const borderColorsSection = document.querySelector('#borderColors').parentElement;
    const borderWidthSection = document.querySelector('#borderWidth').parentElement;
    const fontSizeSection = document.querySelector('#fontSize').parentElement;
    const layerButtons = document.querySelectorAll('#bringForwardBtn, #sendBackwardBtn');
    
    fillColorsSection.style.display = 'none';
    borderColorsSection.style.display = 'none';
    borderWidthSection.style.display = 'none';
    fontSizeSection.style.display = 'none';
    layerButtons.forEach(btn => btn.style.display = 'none');
    
    borderColors.forEach(color => {
        if (color.getAttribute('data-color') === elementData.color) {
            color.classList.add('active');
        } else {
            color.classList.remove('active');
        }
    });
    
    if (selectedElement.classList.contains('rectangle') || selectedElement.classList.contains('circle') || selectedElement.classList.contains('text-container')) {
        fillColorsSection.style.display = 'block';
        borderColorsSection.style.display = 'block';
        borderWidthSection.style.display = 'block';
        
        fillColors.forEach(color => {
            if (color.getAttribute('data-color') === elementData.fillColor) {
                color.classList.add('active');
            } else {
                color.classList.remove('active');
            }
        });
        
        borderWidthSlider.value = elementData.borderWidth;
        borderWidthValue.textContent = elementData.borderWidth + 'px';
        currentBorderWidth = elementData.borderWidth;
        
        if (selectedElement.classList.contains('text-container')) {
            fontSizeSection.style.display = 'block';
            fontSizeSlider.value = elementData.fontSize;
            fontSizeValue.textContent = elementData.fontSize + 'px';
            currentFontSize = elementData.fontSize;
        }
    } else if (selectedElement.classList.contains('line-element') || selectedElement.tagName === 'svg') {
        borderColorsSection.style.display = 'block';
        borderWidthSection.style.display = 'block';
        
        borderWidthSlider.value = elementData.borderWidth;
        borderWidthValue.textContent = elementData.borderWidth + 'px';
        currentBorderWidth = elementData.borderWidth;
    }
    
    layerButtons.forEach(btn => btn.style.display = 'flex');
}

function updateSelectedElementStyle() {
    if (!selectedElement) {
        return;
    }
    
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;
    
    elementData.color = currentColor;
    
    if (selectedElement.classList.contains('rectangle') || selectedElement.classList.contains('circle') || selectedElement.classList.contains('text-container')) {
        elementData.fillColor = currentFillColor;
        elementData.borderWidth = currentBorderWidth;
        
        selectedElement.style.borderColor = currentColor;
        selectedElement.style.borderWidth = currentBorderWidth + 'px';
        selectedElement.style.backgroundColor = currentFillColor;
        
        if (selectedElement.classList.contains('text-container')) {
            const textArea = selectedElement.querySelector('.text-box');
            if (textArea) {
                textArea.style.color = currentColor;
                textArea.style.fontSize = currentFontSize + 'px';
                elementData.fontSize = currentFontSize;
            }
        }
    } else if (selectedElement.classList.contains('line-element')) {
        elementData.borderWidth = currentBorderWidth;
        selectedElement.style.backgroundColor = currentColor;
        selectedElement.style.height = currentBorderWidth + 'px';
    } else if (selectedElement.tagName === 'svg' && selectedElement.classList.contains('arrow-svg')) {
        elementData.borderWidth = currentBorderWidth;
        const line = selectedElement.querySelector('line');
        const polygon = selectedElement.querySelector('polygon');
        
        if (line) {
            line.setAttribute('stroke', currentColor);
            line.setAttribute('stroke-width', currentBorderWidth);
        }
        
        if (polygon) {
            polygon.setAttribute('fill', currentColor);
        }
    }
    
    if (socket && currentBoardId) {
        const updates = {
            color: elementData.color,
            borderWidth: elementData.borderWidth,
            fillColor: elementData.fillColor,
            fontSize: elementData.fontSize
        };
        
        socket.emit('element-update', {
            boardId: currentBoardId,
            elementId: elementData.id,
            updates: updates
        });
    }
}

function deleteSelectedElement() {
    if (!selectedElement) return;
    
    const elementId = parseInt(selectedElement.dataset.id);
    
    selectedElement.remove();
    elements = elements.filter(el => el.id !== elementId);
    
    if (socket && currentBoardId) {
        socket.emit('element-delete', {
            boardId: currentBoardId,
            elementId: elementId
        });
    }
    
    selectedElement = null;
    updatePropertiesPanelForTool();
}

function changeElementZIndex(direction) {
    if (!selectedElement) return;
    
    const elementData = elements.find(el => el.id === parseInt(selectedElement.dataset.id));
    if (!elementData) return;
    
    elementData.zIndex += direction;
    selectedElement.style.zIndex = elementData.zIndex;
    
    if (socket && currentBoardId) {
        socket.emit('element-update', {
            boardId: currentBoardId,
            elementId: elementData.id,
            updates: { zIndex: elementData.zIndex }
        });
    }
}

function changeZoom(delta) {
    currentZoom = Math.max(0.1, Math.min(5, currentZoom + delta));
    updateCanvasTransform();
    updateZoomDisplay();
    broadcastViewport();
}

function resetZoom() {
    currentZoom = 1;
    updateCanvasTransform();
    updateZoomDisplay();
    broadcastViewport();
}

function updateCanvasTransform() {
    boardCanvas.style.transform = `translate(${viewportX * currentZoom}px, ${viewportY * currentZoom}px) scale(${currentZoom})`;
}

function updateZoomDisplay() {
    zoomPercent.textContent = `${Math.round(currentZoom * 100)}%`;
}

function broadcastViewport() {
    if (socket && currentBoardId) {
        socket.emit('viewport-change', {
            boardId: currentBoardId,
            viewport: { x: viewportX, y: viewportY, zoom: currentZoom }
        });
    }
}

function broadcastCursor(x, y) {
    if (socket && currentBoardId) {
        socket.emit('cursor-move', {
            boardId: currentBoardId,
            cursor: { x, y }
        });
    }
}

function updateRemoteCursors(users) {
    for (const userId in users) {
        if (userId !== socketId) {
            addRemoteCursor(userId, users[userId]);
        }
    }
}

function addRemoteCursor(userId, userData) {
    if (remoteCursors[userId]) return;
    
    const cursor = document.createElement('div');
    cursor.className = 'remote-cursor';
    cursor.id = `cursor-${userId}`;
    
    const icon = document.createElement('div');
    icon.className = 'cursor-icon';
    icon.innerHTML = '📍';
    
    const label = document.createElement('div');
    label.className = 'cursor-label';
    label.textContent = userData.name || `User`;
    
    cursor.appendChild(icon);
    cursor.appendChild(label);
    document.body.appendChild(cursor);
    
    remoteCursors[userId] = cursor;
    
    updateUsersOnline();
}

function updateRemoteCursor(userId, cursorPos) {
    const cursor = remoteCursors[userId];
    if (cursor) {
        const x = (cursorPos.x - viewportX) * currentZoom;
        const y = (cursorPos.y - viewportY) * currentZoom;
        
        cursor.style.transform = `translate(${x}px, ${y}px)`;
    }
}

function removeRemoteCursor(userId) {
    const cursor = remoteCursors[userId];
    if (cursor) {
        cursor.remove();
        delete remoteCursors[userId];
    }
    updateUsersOnline();
}

function updateUsersOnline() {
    if (!currentBoardId || !socket) return;
    
    const totalUsers = Object.keys(remoteCursors).length + 1;
    usersOnline.innerHTML = '';
    
    const badge = document.createElement('div');
    badge.className = 'user-badge';
    badge.textContent = totalUsers;
    badge.title = `${totalUsers} пользователей онлайн`;
    usersOnline.appendChild(badge);
}

async function saveBoard() {
    if (!currentBoardId) {
        await createNewBoard();
    }
    
    try {
        const response = await fetch('/api/save-board', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                boardId: currentBoardId,
                elements: elements
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Доска сохранена!', 'success');
        }
    } catch (error) {
        showNotification('Ошибка при сохранении доски', 'error');
    }
}

function autoSave() {
    if (currentBoardId && elements.length > 0) {
        saveBoard();
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
            remoteCursors = {};
            
            if (socket) {
                socket.emit('join-board', currentBoardId);
            }
            
            loadModal.style.display = 'none';
            showNotification('Доска загружена!', 'success');
        }
    } catch (error) {
        showNotification('Ошибка при загрузке доски', 'error');
    }
}

function showLoadModal() {
    loadModal.style.display = 'flex';
    
    try {
        fetch('/api/boards')
            .then(response => response.json())
            .then(data => {
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
                }
            });
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

function renderElements() {
    elements.forEach(elementData => {
        renderElement(elementData);
    });
}

function renderElement(elementData) {
    let element;
    
    switch(elementData.type) {
        case 'rectangle':
            element = createRectangle(
                elementData.x, 
                elementData.y, 
                elementData.width, 
                elementData.height
            );
            applyElementStyles(element, elementData);
            break;
        case 'circle':
            element = createCircle(
                elementData.x, 
                elementData.y, 
                elementData.width
            );
            applyElementStyles(element, elementData);
            break;
        case 'line':
            element = createLine(
                elementData.x, 
                elementData.y, 
                elementData.endX || elementData.x + elementData.width, 
                elementData.endY || elementData.y
            );
            applyElementStyles(element, elementData);
            break;
        case 'arrow':
            element = createArrow(
                elementData.x, 
                elementData.y, 
                elementData.endX || elementData.x + elementData.width, 
                elementData.endY || elementData.y
            );
            applyElementStyles(element, elementData);
            break;
        case 'text':
            element = document.createElement('div');
            element.className = 'shape text-container';
            element.style.left = elementData.x + 'px';
            element.style.top = elementData.y + 'px';
            element.style.width = elementData.width + 'px';
            element.style.height = elementData.height + 'px';
            element.style.borderColor = elementData.color;
            element.style.borderWidth = elementData.borderWidth + 'px';
            element.style.borderStyle = 'solid';
            element.style.backgroundColor = elementData.fillColor;
            element.style.zIndex = elementData.zIndex;
            element.style.padding = '8px';
            element.style.borderRadius = '4px';
            
            const textArea = document.createElement('textarea');
            textArea.className = 'text-box';
            textArea.style.width = '100%';
            textArea.style.height = '100%';
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.background = 'transparent';
            textArea.style.resize = 'none';
            textArea.style.overflow = 'hidden';
            textArea.style.color = elementData.color;
            textArea.style.fontSize = elementData.fontSize + 'px';
            textArea.style.fontFamily = 'inherit';
            textArea.style.lineHeight = '1.4';
            textArea.value = elementData.content;
            textArea.placeholder = 'Введите текст...';
            
            textArea.addEventListener('blur', function() {
                const elData = elements.find(el => el.id === parseInt(element.dataset.id));
                if (elData) {
                    elData.content = this.value;
                    adjustTextContainerHeight(element, textArea);
                }
            });
            
            textArea.addEventListener('input', function() {
                adjustTextContainerHeight(element, textArea);
            });
            
            element.appendChild(textArea);
            boardCanvas.appendChild(element);
            break;
    }
    
    if (element) {
        element.dataset.id = elementData.id;
        element.style.zIndex = elementData.zIndex;
    }
}

function applyElementStyles(element, elementData) {
    if (element.classList.contains('rectangle') || element.classList.contains('circle')) {
        element.style.borderColor = elementData.color;
        element.style.borderWidth = elementData.borderWidth + 'px';
        element.style.backgroundColor = elementData.fillColor;
    } else if (element.classList.contains('line-element')) {
        element.style.backgroundColor = elementData.color;
        element.style.height = elementData.borderWidth + 'px';
    } else if (element.tagName === 'svg' && element.classList.contains('arrow-svg')) {
        const line = element.querySelector('line');
        const polygon = element.querySelector('polygon');
        
        if (line) {
            line.setAttribute('stroke', elementData.color);
            line.setAttribute('stroke-width', elementData.borderWidth);
        }
        
        if (polygon) {
            polygon.setAttribute('fill', elementData.color);
        }
    } else if (element.classList.contains('text-container')) {
        element.style.borderColor = elementData.color;
        element.style.borderWidth = elementData.borderWidth + 'px';
        element.style.backgroundColor = elementData.fillColor;
        
        const textArea = element.querySelector('.text-box');
        if (textArea) {
            textArea.style.color = elementData.color;
            textArea.style.fontSize = elementData.fontSize + 'px';
        }
    }
}

function updateElementVisual(elementData) {
    const element = boardCanvas.querySelector(`[data-id="${elementData.id}"]`);
    if (!element) return;
    
    element.style.left = elementData.x + 'px';
    element.style.top = elementData.y + 'px';
    
    if (elementData.width) element.style.width = elementData.width + 'px';
    if (elementData.height) element.style.height = elementData.height + 'px';
    
    applyElementStyles(element, elementData);
    
    if (element.classList.contains('selected')) {
        updateResizeHandles();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
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

boardIdDisplay.addEventListener('click', () => {
    if (currentBoardId) {
        navigator.clipboard.writeText(currentBoardId)
            .then(() => {
                showNotification('ID доски скопирован в буфер обмена!', 'success');
            });
    }
});

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('board');
    
    if (boardId) {
        currentBoardId = boardId;
        boardIdDisplay.textContent = `ID: ${boardId.substring(0, 8)}...`;
        boardIdDisplay.title = `Нажмите чтобы скопировать ID: ${boardId}`;
        init();
    } else {
        createNewBoard();
        init();
    }
});