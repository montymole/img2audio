

const el = (sel) => document.querySelector(sel)
const status = el('#status')
const canvas = el("#canvas")
const ctx = canvas.getContext("2d")
const img = new Image()
const fileReader = new FileReader()
const downloadlink = el('#downloadlink')
const uploadButton = el("#fileUpload")
const convertBtn = el('#convertBtn')
const rotateBtn = el('#rotateBtn')
const durationInput = el('#duration')
const audio = el('#audio')
const playBtn = el('#playBtn')
const selection = {
  x:0,
  y:0,
  w:canvas.width,
  h:canvas.height
}
const selectionArea = el('#selectionArea')
const selectionBox = el('#selectionBox')

function log(t) {
  status.innerHTML += `<pre>${t}</pre>`
}

function updateBox() {
  selectionBox.style.top = selection.y + 'px'
  selectionBox.style.left = selection.x + 'px'
  selectionBox.style.width = selection.w + 'px'
  selectionBox.style.height = selection.h + 'px'
}

selectionArea.addEventListener('mouseover', (evt) => {
  selectionArea.style.cursor = 'hand'
})

selectionArea.addEventListener('mouseout', (evt) => {
  selectionArea.style.cursor = ''
  if (selection.started) {
    selection.w = evt.offsetX - selection.x
    selection.h = evt.offsetY - selection.y
  }
  updateBox()
})

selectionArea.addEventListener('mousedown', (evt) => {
  if (!selection.started) {
    selection.started = true
    selection.x = evt.offsetX
    selection.y = evt.offsetY
  }
  updateBox()
})

selectionArea.addEventListener('mousemove', (evt) => {
  if (selection.started) {
    selection.w = evt.offsetX - selection.x
    selection.h = evt.offsetY - selection.y
  }
  updateBox()
})

selectionArea.addEventListener('mouseup', (evt) => {
  if (selection.started) {
    selection.w = evt.offsetX - selection.x
    selection.h = evt.offsetY - selection.y
    selection.started = false
  }
  updateBox()
})


let imageFile
let wave

var wf = new WFPlayer({
  container: el('#waveform'),
  waveColor: 'rgba(128, 255, 0, 0.9)',
  backgroundColor: 'rgb(10, 10, 10)',
  gridColor: 'rgba(255, 255, 255, 0.1)',
  progress: true, 
})

img.addEventListener("load", () => {
  canvas.width = window.innerWidth*0.5
  canvas.height = (img.height/img.width)*canvas.width
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height)
})

fileReader.addEventListener("load", (evt) => {
  img.src = evt.target.result
  convertBtn.disabled = false
  rotateBtn.disabled = false
})

uploadButton.addEventListener("change", function () {
  imageFile = this.files && this.files[0]
  if (imageFile) {
    downloadlink.text = imageFile.name
    wave = null
    fileReader.readAsDataURL(this.files[0])
  }
})

convertBtn.addEventListener("click", (evt) => {
  const duration = Number(durationInput.value)
  window.status = `converting ${imageFile.name} to ${duration} wav from top to bottom`
  imageToSample(duration, selection)
})

rotateBtn.addEventListener("click", (evt) => {
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(-Math.PI / 2)
  const cx = img.width/2
  const cy = img.width/2
  ctx.drawImage(img, -cx, -cy, img.width, img.height)
  ctx.translate(-canvas.width / 2, -canvas.height / 2)

})

playBtn.addEventListener("click", (evt) => {
  audio.play();
})

function imageToSample(durationSeconds, s) {
  const sx = s && s.x || 0
  const sy = s && s.y || 0
  const height = s && s.h || canvas.height
  const width = s && s.w || canvas.width
  const tmpData = []
  let maxFreq = 0
  const data = []
  const sampleRate = 44100
  const channels = 1
  const numSamples = Math.round(sampleRate * durationSeconds)
  const samplesPerPixel = Math.floor(numSamples / width)
  const maxSpecFreq = 20000 // Hz
  const C = maxSpecFreq / height
  const yFactor = 2 // y-axis resolution
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  log(`converting (${sx},${sy}) ${width}x${height}`)

  for (let x = 0; x < numSamples; x++) {
    let rez = 0
    let pixel_x = Math.floor((sx+x) / samplesPerPixel)
    for (let y = 0; y < height; y += yFactor) {
      let pixel_index = ((sy+y) * width + pixel_x) * 4
      let r = imgData.data[pixel_index]
      let g = imgData.data[pixel_index + 1]
      let b = imgData.data[pixel_index + 2]
      let s = r + b + g
      let volume = Math.pow(s * 100 / 765, 2)
      let freq = Math.round(C * (height - y + 1))
      rez += Math.floor(volume * Math.cos(freq * 6.28 * x / sampleRate))
    }
    tmpData.push(rez)
    if (Math.abs(rez) > maxFreq) {
      maxFreq = Math.abs(rez)
    }
  }

  for (let i = 0; i < tmpData.length; i++) {
    data.push(32767 * tmpData[i] / maxFreq) //32767
  }

  wave = new RIFFWAVE()
  wave.header.sampleRate = sampleRate
  wave.header.numChannels = channels
  wave.header.bitsPerSample = 16
  wave.Make(data) 
  downloadlink.href = wave.dataURI
  const fileName = imageFile.name.split('.')[0] + '.wav'
  downloadlink.download = fileName
  downloadlink.text = fileName
  audio.src = wave.dataURI
  wf.load(audio)
  wf.setOptions({ duration: durationSeconds+1 })
  playBtn.disabled = false
  log(`DONE`)
}

log(`
  to start upload file
  then set duration of sample
  select area to convert
  push conversion button
  
  `)   