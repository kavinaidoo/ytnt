// Globals

var player; // YT Player

var offCanvasMobileDeviceBootstrap = new bootstrap.Offcanvas(document.getElementById('offCanvasMobileDevice')) // Login offCanvas element
var loadVideoButtonElement = document.getElementById('loadVideoButton')
var loadVideoTextElement = document.getElementById('loadVideoText')
var introTextElement = document.getElementById('introText')
var vidAndEditorElement = document.getElementById('vidAndEditor')
var downloadDOCXButtonElement = document.getElementById('downloadDOCXButton')
var clearNotesButtonElement = document.getElementById('clearNotesButton')
var playPauseButtonElement = document.getElementById('playPauseButton')
var back10ButtonElement = document.getElementById('back10Button')
var back30ButtonElement = document.getElementById('back30Button')
var forward5ButtonElement = document.getElementById('forward5Button')

const edjsParser = edjsHTML();
const editor = new EditorJS({
  holder: 'editorjs',
  minHeight : 0,
  tools: {
    header: {
      class: Header,
      inlineToolbar: true, // Optional: enable inline toolbar for header
      config: {
        placeholder: 'Enter a header'
      }
    },
    paragraph: {
      class: Paragraph,
      inlineToolbar: true, // Optional: enable inline toolbar for paragraph
      config: {
        placeholder: 'Click here and start typing...'
      }
    },
    list: {
      class: EditorjsList,
      inlineToolbar: true,
      config: {
        defaultStyle: 'unordered'
      },
    },
  },
  onReady: () => {
      new Undo({ editor });
  },
});

// Functions

function loadYTPlayer(videoId){
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: videoId,
    host: 'https://www.youtube-nocookie.com',
    playerVars: {
      'autoplay': 1,
      'controls': 1,
      'rel': 0,
      'iv_load_policy': 3,
      'cc_load_policy': 1,
      'cc_lang_pref':'en',
      'playsinline':1,
      'fs':0,
      'disablekb':1,
    },
    events: {
      'onReady': onPlayerReady,
      'onError': onPlayerError
    }
  });
}

function destroyYTPlayer() { // destroys player
  if (player && typeof player.destroy === 'function') {
    player.destroy();
    player = null;
  }
}

function onYouTubeIframeAPIReady() { // called when YT API loads
  loadVideoButtonElement.classList = "btn btn-outline-secondary" // enables load video button
  loadVideoTextElement.disabled = false;
}

function ytIdFromURL(urlString){ // extracts video id from YT url
  if (typeof urlString !== 'string') {
    return null;
  }
  if (urlString.length == 0){
    urlString = "https://www.youtube.com/watch?v=g1SNgw0XNoI"
  }

  try {
    var url = new URL(urlString);
    var urlParams = new URLSearchParams(url.search);
    return urlParams.get('v');
  } catch (e) {
    return null
  }
}

function pulseOnce(elementString) {
  const btn = document.getElementById(elementString);
  btn.classList.remove('pulse-once'); 
  void btn.offsetWidth;
  btn.classList.add('pulse-once');
}

function onPlayerReady(event) {
  window.addEventListener('keydown', function(event) {
    if (event.altKey) {
      if (event.code === 'Digit1') {
        event.preventDefault();
        if (player.getPlayerState() === YT.PlayerState.PLAYING) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
        pulseOnce('playPauseButton') 
      } else if (event.code === 'Digit2') {
        event.preventDefault();
        var currentTime = player.getCurrentTime();
        var newTime = Math.max(0, currentTime - 10);
        player.seekTo(newTime, true);
        pulseOnce('back10Button') 
      } else if (event.code === 'Digit3') {
        event.preventDefault();
        var currentTime = player.getCurrentTime();
        var newTime = Math.max(0, currentTime - 30);
        player.seekTo(newTime, true);
        pulseOnce('back30Button') 
      } else if (event.code === 'Digit4') {
        event.preventDefault();
        var currentTime = player.getCurrentTime();
        var newTime = Math.min(player.getDuration(), currentTime + 5);
        player.seekTo(newTime, true);
        pulseOnce('forward5Button') 
      }
    }
  }, true);
}

function onPlayerError(event) {
  console.error('Player error:', event.data);
}

function htmlToDocx(element) {
  const children = [];
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
      children.push(new docx.TextRun(child.textContent));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      switch (child.tagName.toLowerCase()) {
        case 'p':
          children.push(new docx.Paragraph({
            children: htmlToDocx(child)
          }));
          break;
        case 'h1':
          children.push(new docx.Paragraph({
            children: htmlToDocx(child),
            heading: docx.HeadingLevel.HEADING_1
          }));
          break;
        case 'h2':
          children.push(new docx.Paragraph({
            children: htmlToDocx(child),
            heading: docx.HeadingLevel.HEADING_2
          }));
          break;
        case 'ul':
        case 'ol':
          child.querySelectorAll('li').forEach(li => {
            children.push(new docx.Paragraph({
              children: htmlToDocx(li),
              bullet: child.tagName.toLowerCase() === 'ul' ? { level: 0 } : { level: 0, style: 'decimal' }
            }));
          });
          break;
        case 'li':
          children.push(new docx.TextRun(child.textContent));
          break;
        default:
          console.warn(`Unsupported tag: ${child.tagName}`);
      }
    }
  }
  return children;
}

// Initial loading

if (/Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768){
  offCanvasMobileDeviceBootstrap.show() // detecting mobile devices
}

// Events

loadVideoButtonElement.addEventListener('click', () => {
  var videoURL = loadVideoTextElement.value
  var ytId = ytIdFromURL(videoURL)
  
  if (!ytId){
    loadVideoTextElement.value = "URL Error, Try Again..."
    loadVideoTextElement.disabled = true
    loadVideoButtonElement.innerText = "Load Failed"
    loadVideoButtonElement.classList = "btn btn-outline-danger"
    setTimeout(function(){
      loadVideoTextElement.value = ""
      loadVideoTextElement.disabled = false
      loadVideoButtonElement.innerText = "Load Video"
      loadVideoButtonElement.classList = "btn btn-outline-secondary"
    },3000);
  } else {
    destroyYTPlayer()
    introTextElement.style = "display:none"
    vidAndEditorElement.style = "display:block"
    loadVideoTextElement.value = ""
    loadVideoButtonElement.innerText = "Loading.."
    loadVideoButtonElement.classList = "btn btn-outline-success"
    setTimeout(function(){
      loadVideoTextElement.value = ""
      loadVideoButtonElement.innerText = "Load Video"
      loadVideoButtonElement.classList = "btn btn-outline-secondary"
    },3000);
    loadYTPlayer(ytId)
  }
})

downloadDOCXButtonElement.addEventListener('click', async () => {
  var outputData = await editor.save()
  htmlString = edjsParser.parse(outputData);
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const docxChildren = htmlToDocx(doc.body);
  const docxDoc = new docx.Document({
    sections: [{
      properties: {},
      children: docxChildren
    }]
  });
  const blob = await docx.Packer.toBlob(docxDoc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.docx';
  a.click();
  URL.revokeObjectURL(url);
})

clearNotesButtonElement.addEventListener('click', () => {
  editor.blocks.clear();
})

playPauseButtonElement.addEventListener('click', () => {
  if (player.getPlayerState() === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
})

back10ButtonElement.addEventListener('click', () => {
  var currentTime = player.getCurrentTime();
  var newTime = Math.max(0, currentTime - 10);
  player.seekTo(newTime, true);
})

back30ButtonElement.addEventListener('click', () => {
  var currentTime = player.getCurrentTime();
  var newTime = Math.max(0, currentTime - 30);
  player.seekTo(newTime, true);
})

forward5ButtonElement.addEventListener('click', () => {
  var currentTime = player.getCurrentTime();
  var newTime = Math.min(player.getDuration(), currentTime + 5);
  player.seekTo(newTime, true);
})