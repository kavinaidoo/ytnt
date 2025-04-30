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
var distractionButtonElement = document.getElementById('distractionButton')

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
        placeholder: 'Click here and start typing notes...'
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
    urlString = "https://www.youtube.com/watch?v=h6FS70B0blQ"
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

distractionButtonElement.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
})

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

async function speechRecognitionPermissions(){
  if (!SpeechRecognition) {
    document.getElementById('interimTranscript').innerText = 'Your browser does not support Voice Transcription. Try using Chrome or Edge. (Web Speech API not supported)'
    var requestVoicePermissionButtonElement =  document.getElementById('requestVoicePermissionButton')
    requestVoicePermissionButtonElement.style = 'display:none'
  } else {

    var permissionStatusObject = await navigator.permissions.query({ name: 'microphone' })
    var permissionStatus = permissionStatusObject.state

    if (permissionStatus == 'denied'){
      document.getElementById('interimTranscript').innerHTML = 'Voice Transcription uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Allow the Microphone permission in your browser settings and reload the page to use this feature.'
      document.getElementById('requestVoicePermissionButton').style = 'display:none'
    } else if (permissionStatus == 'prompt'){
      document.getElementById('interimTranscript').innerHTML = 'Voice Transcription uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Click "Request Microphone Permission" and allow to use this feature.'
      document.getElementById('voiceTransToggle').disabled = true;
      document.getElementById('voiceTransToggleText').innerText = 'Voice Transcription Disabled'

      var requestVoicePermissionButtonElement =  document.getElementById('requestVoicePermissionButton')
      
      requestVoicePermissionButtonElement.addEventListener('click', async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          requestVoicePermissionButtonElement.style = 'display:none'
          console.log('Microphone access granted');
          document.getElementById('interimTranscript').innerText = 'Voice Transcription uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech.'
          document.getElementById('voiceTransToggle').disabled = false;
          document.getElementById('voiceTransToggleText').innerText = 'Voice Transcription Off'
        } catch (error) {
          console.error('Error requesting microphone permission:', error);
          document.getElementById('interimTranscript').innerHTML = 'Voice Transcription uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Allow the Microphone permission in your browser settings and reload the page to use this feature.'
          document.getElementById('requestVoicePermissionButton').style = 'display:none'
        }
      })

    } else {
      document.getElementById('interimTranscript').innerText = 'Voice Transcription uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.'
      document.getElementById('voiceTransToggle').disabled = false;
      document.getElementById('voiceTransToggleText').innerText = 'Voice Transcription Off'
      var requestVoicePermissionButtonElement =  document.getElementById('requestVoicePermissionButton')
      requestVoicePermissionButtonElement.style = 'display:none'
    }
  }
}
speechRecognitionPermissions()

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  const voiceTransToggleElement = document.getElementById('voiceTransToggle');
  const transcriptDiv = document.getElementById('interimTranscript');

  var userStopped = false

  voiceTransToggleElement.addEventListener('click', () => {
    if(voiceTransToggleElement.checked){
      document.getElementById('voiceTransToggleText').innerText = 'Voice Transcription On'
      recognition.start();
      transcriptDiv.textContent = 'Listening to device microphone...';
      userStopped = false
    } else {
      document.getElementById('voiceTransToggleText').innerText = 'Voice Transcription Off'
      userStopped = true
      recognition.stop();
    }
  })

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    transcriptDiv.textContent = finalTranscript + interimTranscript;

    if(finalTranscript.length > 0){
        addToTranscriptList(finalTranscript)
        transcriptDiv.textContent = ""
    }
  
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    transcriptDiv.innerText = `Error: ${event.error}`;
  }

  recognition.onend = (e) => {
    console.log('- recognition.onend')
    voiceTransToggleElement.checked = false
    if (!transcriptDiv.textContent || transcriptDiv.textContent === 'Listening to video audio...') {
      transcriptDiv.textContent = 'No speech detected.';
    }
    if (userStopped == false){
      try {
      console.warn('userStopped == false - trying to restart')
      recognition.start();
      voiceTransToggleElement.checked = true
      console.warn('userStopped == false - restart success')
      } catch {
        console.error('userStopped == false - restart failed')
      }
    }
  }

  function addToTranscriptList(text) {
    const holder = document.getElementById('voiceTransHolder');
    if (holder) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '12px';
      card.innerHTML = `
        <div class="card-body">
          <p class="card-text">${text}</p>
        </div>
      `;
      holder.insertBefore(card, holder.firstChild);
    }
  }

}
