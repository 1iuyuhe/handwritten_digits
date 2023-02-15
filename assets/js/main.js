const select = document.getElementById("select-form");
const randomButton = document.getElementById("random-button");
const clearButton = document.getElementById("clear-button");
const recognizeButton = document.getElementById("recognize-button");
const inputArea = document.getElementById("input-area");
const resultSpan = document.getElementById("result-span")

let mode = 1;
let canvas = null;
let ctx = null;
let painting = false;
let clear = false;
let lWidth = 8;
let lastPoint = {x: undefined, y: undefined};
let imageUrl = null;

createCanvas(mode);

select.addEventListener("change", () => {
    if (select.value === "1") {
        mode = 1;
        if (randomButton.hasAttribute("disabled")) {
            randomButton.removeAttribute("disabled");
        }
    } else if (select.value === "2") {
        mode = 2;
        randomButton.setAttribute("disabled", "true");
    }
    createCanvas(mode);
});

clearButton.addEventListener("click", () => {
    clearAll();
});

randomButton.addEventListener("click", () => {
    clearAll();
    fetch('/api/v1/random', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 0) {
            imageUrl = data.data
            let img = new Image();
            img.src = imageUrl;
            img.onload = function () {
                ctx.drawImage(img, 0, 0);
            }
        } else {
            if (data.msg) {
                alert(data.msg);
            } else {
                alert('Error');
            }
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

recognizeButton.addEventListener("click", () => {
    if (mode === 1) {
        recognize(mode, imageUrl)
    } else if (mode === 2) {
        let filename = 'image.png';
        let imgUrl = canvas.toDataURL("image/png");
        let arr = imgUrl.split(','), 
        mime = arr[0].match(/:(.*?);/)[1], 
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        let fileList = new File([u8arr], filename, {type: mime});
        let formData = new FormData();
        formData.append('file', fileList, fileList.name);
        fetch('/api/v1/upload', {
            method: 'PUT',
            body: formData
        }).then(resp => resp.json())
        .then(data => {
            if (data.code === 0) {
                imageUrl = data.data
                recognize(mode, imageUrl)
            } else {
                if (data.msg) {
                    alert(data.msg);
                } else {
                    alert('Error');
                }
            }
        }).catch(err => {
            console.log('Error: ', err);
        });
    }
});

function createCanvas(mode) {
    function createCanvasByMode(mode) {
        canvas = document.createElement("canvas");
        canvas.width = inputArea.clientWidth;
        canvas.height = inputArea.clientHeight;
        canvas.style.background = '#000000';
        ctx = canvas.getContext("2d");
        inputArea.appendChild(canvas);
        if (mode === 2) {
            ctx.strokeStyle = '#ffffff';
            canvas.onmousedown = function (e) {
                painting = true;
                let x = e.clientX - canvas.offsetLeft;
                let y = e.clientY - canvas.offsetTop;
                lastPoint = {"x": x, "y": y};
                ctx.save();
                drawCircle(x, y, 0);
            };
            canvas.onmousemove = function (e) {
                if (painting) {
                    let x = e.clientX - canvas.offsetLeft;
                    let y = e.clientY - canvas.offsetTop;
                    let newPoint = {"x": x, "y": y};
                    drawLine(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y,clear);
                    lastPoint = newPoint;
                }
            };
    
            canvas.onmouseup = function () {
                painting = false;
            };
    
            canvas.onmouseleave = function () {
                painting = false;
            };
        } else if (mode === 1) {
            ctx.scale(10, 10)
        }
    }
    while (inputArea.firstChild) {
        inputArea.removeChild(inputArea.firstChild);
    }
    createCanvasByMode(mode);
}

function drawCircle(x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (clear) {
        ctx.clip();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.restore();
    }
}

function drawLine(x1, y1, x2, y2) {
    ctx.lineWidth = lWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (clear) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
        ctx.clip();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.restore();
    }else{
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    }
}

function clearAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    resultSpan.innerText = "";
}

function recognize(mode, imageUrl) {
    data = {mode: mode, imageUrl: imageUrl}
    fetch('/api/v1/recognize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 0) {
            resultSpan.innerText = '';
            resultSpan.innerText = data.data;
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}