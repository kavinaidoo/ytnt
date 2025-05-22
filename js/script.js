// Globals

var player; // YT Player

var offCanvasMobileDeviceBootstrap = new bootstrap.Offcanvas(document.getElementById('offCanvasMobileDevice')) // Login offCanvas element
var loadVideoButtonElement = document.getElementById('loadVideoButton')
var loadVideoTextElement = document.getElementById('loadVideoText')
var introTextElement = document.getElementById('introText')
var vidAndEditorElement = document.getElementById('vidAndEditor')
var downloadDOCXButtonElement = document.getElementById('downloadDOCXButton')
var newNotesButtonElement = document.getElementById('newNotesButton')
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
  onChange : async () => {
    saveToLocalStorage()
  }
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

function loadVideoFromQueryParam(){ // loads a video if it has been passed via ?v=
  var v = (new URLSearchParams((new URL(window.location.href)).search)).get('v');
  if(v){
    loadVideoTextElement.value = "https://www.youtube.com/watch?v=" + v
    loadVideoButtonElement.click()
  }
}

function onYouTubeIframeAPIReady() { // called when YT API loads
  loadVideoTextElement.disabled = false;
  loadVideoTextElement.classList.add('border-light')
  loadVideoButtonElement.classList = "btn btn-outline-light" // enables load video button
  loadVideoFromQueryParam()
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

  setTimeout( async () => { // waiting so that player.getVideoData().author is not empty
    await editor.blocks.insert('paragraph', {
      text: player.getVideoData().author + " - " + player.getVideoData().title + " - " + "https://www.youtube.com/watch?v="+ player.getVideoData().video_id
    },{}, editor.blocks.getBlocksCount(), true);
    const newBlockIndex = editor.blocks.getBlocksCount() - 1; // Assuming it's the last block
    editor.caret.setToBlock(newBlockIndex, 'end');
  }, 1000);

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

const tag = document.createElement('script');
tag.src = `https://www.youtube.com/iframe_api?ts=${new Date().getTime()}`;
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Events

loadVideoButtonElement.addEventListener('click', () => {
  var videoURL = loadVideoTextElement.value
  var ytId = ytIdFromURL(videoURL)
  
  if (!ytId){
    loadVideoTextElement.value = "URL Error, Try Again..."
    loadVideoTextElement.disabled = true
    loadVideoTextElement.classList = 'form-control border-danger'
    loadVideoButtonElement.innerText = "Load Failed"
    loadVideoButtonElement.classList = "btn btn-outline-danger"
    setTimeout(function(){
      loadVideoTextElement.value = ""
      loadVideoTextElement.disabled = false
      loadVideoTextElement.classList = 'form-control border-light'
      loadVideoButtonElement.innerText = "Load Video"
      loadVideoButtonElement.classList = "btn btn-outline-light"
    },1000);
  } else {
    destroyYTPlayer()
    introTextElement.style = "display:none"
    vidAndEditorElement.style = "display:block"
    loadVideoTextElement.value = ""
    loadVideoTextElement.classList = 'form-control border-success'
    loadVideoButtonElement.innerText = "Loading..."
    loadVideoButtonElement.classList = "btn btn-outline-success"
    setTimeout(function(){
      loadVideoTextElement.value = ""
      loadVideoTextElement.classList = 'form-control border-light'
      loadVideoButtonElement.innerText = "Load Video"
      loadVideoButtonElement.classList = "btn btn-outline-light"
    },1000);
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
  var fileName = ""
  try {
    filename = 'YTNT - '+player.getVideoData().author + ' - ' + player.getVideoData().title
  } catch {
    filename = 'YTNT'
  }
  a.download = filename+'.docx';
  a.click();
  URL.revokeObjectURL(url);
})

newNotesButtonElement.addEventListener('click', () => {
  saveToLocalStorage()
  setTimeout(() => {
    autoSaveElement.innerText = "AutoSave Off"
    notesNameTextElement.value = ""
    currentDocumentName = ""
    editor.blocks.clear();
  }, 1010);
  
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

// Speech Recognition

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

async function speechRecognitionPermissions(){
  if (!SpeechRecognition) {
    document.getElementById('interimTranscript').innerText = 'Your browser does not support Speech-to-Text. Try using Chrome or Edge. (Web Speech API not supported)'
    var requestVoicePermissionButtonElement =  document.getElementById('requestVoicePermissionButton')
    requestVoicePermissionButtonElement.style = 'display:none'
  } else {

    var permissionStatusObject = await navigator.permissions.query({ name: 'microphone' })
    var permissionStatus = permissionStatusObject.state

    if (permissionStatus == 'denied'){
      document.getElementById('interimTranscript').innerHTML = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Allow the Microphone permission in your browser settings and reload the page to use this feature.'
      document.getElementById('requestVoicePermissionButton').style = 'display:none'
    } else if (permissionStatus == 'prompt'){
      document.getElementById('interimTranscript').innerHTML = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Click "Request Microphone Permission" and allow to use this feature.'
      document.getElementById('voiceTransToggle').disabled = true;
      document.getElementById('voiceTransToggleText').innerText = 'Speech-to-Text Disabled'

      var requestVoicePermissionButtonElement =  document.getElementById('requestVoicePermissionButton')
      
      requestVoicePermissionButtonElement.addEventListener('click', async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          requestVoicePermissionButtonElement.style = 'display:none'
          console.log('Microphone access granted');
          document.getElementById('interimTranscript').innerText = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech.'
          document.getElementById('voiceTransToggle').disabled = false;
          document.getElementById('voiceTransToggleText').innerHTML = 'Speech-to-Text Off <span class="gray">⌥5<span>'
        } catch (error) {
          console.error('Error requesting microphone permission:', error);
          document.getElementById('interimTranscript').innerHTML = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Allow the Microphone permission in your browser settings and reload the page to use this feature.'
          document.getElementById('requestVoicePermissionButton').style = 'display:none'
        }
      })

    } else {
      document.getElementById('interimTranscript').innerText = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.'
      document.getElementById('voiceTransToggle').disabled = false;
      document.getElementById('voiceTransToggleText').innerHTML = 'Speech-to-Text Off <span class="gray">⌥5<span>'
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
      document.getElementById('voiceTransToggleText').innerHTML = 'Speech-to-Text On <span class="gray">⌥5<span>'
      recognition.start();
      transcriptDiv.textContent = 'Listening to device microphone...';
      userStopped = false
    } else {
      document.getElementById('voiceTransToggleText').innerHTML = 'Speech-to-Text Off <span class="gray">⌥5<span>'
      userStopped = true
      recognition.stop();
      transcriptDiv.textContent = 'Stopped listening to device microphone.';
    }
  })

  function pushTranscriptToEditor(ref){
    try {
      newText = document.getElementById("transShortcut"+ref).innerText
      editor.blocks.insert('paragraph', {
        text: newText
      });
      const newBlockIndex = editor.blocks.getBlocksCount() - 1; // Assuming it's the last block
      editor.caret.setToBlock(newBlockIndex, 'end');

      const editorjsHolderElement = document.getElementById('editorjsHolder');
      editorjsHolderElement.scrollTop = editorjsHolderElement.scrollHeight;


    } catch {console.warn("using transcript shortcut that doesn't exist")}
  }

  window.addEventListener('keydown', function(event) {
    if (event.altKey) {
      if (event.code === 'Digit5') {
        event.preventDefault();
        document.getElementById('voiceTransToggle').click();
      } else if (event.code === 'Digit6'){
        event.preventDefault();
        pushTranscriptToEditor('6')
      } else if (event.code === 'Digit7'){
        event.preventDefault();
        pushTranscriptToEditor('7')
      } else if (event.code === 'Digit8'){
        event.preventDefault();
        pushTranscriptToEditor('8')
      } else if (event.code === 'Digit9'){
        event.preventDefault();
        pushTranscriptToEditor('9')
      }
    }
  }, true);

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
      transcriptDiv.textContent = 'Stopped listening to device microphone.';
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
    if (text !== " "){
      const holder = document.getElementById('voiceTransHolder');
      if (holder) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '12px';
        card.style.position = 'relative'; //🟡
        card.innerHTML = `
          <div class="card-body transcript">
            <span class="gray" style="position: absolute; top: 0px; right: 5px;">
            </span>
            <p class="card-text">${text}</p>
          </div>
        `;
        holder.insertBefore(card, holder.firstChild);
        resetShortcutReferences()
      }

      function resetShortcutReferences(){
        var cards = document.getElementsByClassName('transcript')
        var nCardsToWrite = Math.min(cards.length,4)
        var n = 0
        for (var card of cards){
          n = n + 1
          if (n <= nCardsToWrite){
            card.querySelector('span').innerText="⌥"+String(n+5)
            card.querySelector('.card-text').id = "transShortcut"+String(n+5)
          } else {
            card.querySelector('span').innerText=""
            card.querySelector('.card-text').id = ""
          }
        }
      }
    }
  }

}

// Loading and Saving Notes

var currentDocumentName = ""
var saveNameButtonElement = document.getElementById('saveNameButton')
var notesNameTextElement = document.getElementById('notesNameText')
saveNameButtonElement.addEventListener('click', () => {
  if (notesNameTextElement.value == ""){
    saveNameButtonElement.innerText = "Name is Blank!"
    setTimeout(() => {
        saveNameButtonElement.innerText = "Save Name"
    }, 1000);
  } else if (!(/^[A-Za-z0-9\s]*$/.test(notesNameTextElement.value))){
    saveNameButtonElement.innerText = "Can only contain letters, numbers and spaces"
    notesNameTextElement.value = ""
    setTimeout(() => {
        saveNameButtonElement.innerText = "Save Name"
    }, 1000);
  } else {
    currentDocumentName = notesNameTextElement.value
    autoSaveElement.innerText = "AutoSave On"
    saveToLocalStorage()
  }
})

var autoSaveElement = document.getElementById('autoSave')
async function saveToLocalStorage(){
  if (currentDocumentName !== ""){
    try {
      const outputData = await editor.save();
      var localStoragePayload = {}
      localStoragePayload.editorData = outputData
      localStoragePayload.lastUpdated = Math.floor(Date.now() / 1000)
      localStorage.setItem("ytnt_"+currentDocumentName, JSON.stringify(localStoragePayload));
      autoSaveElement.innerText = "Saving..."
      setTimeout(() => {
          autoSaveElement.innerText = "AutoSave On"
      }, 1000);
    } catch (error) {
        console.error('Saving failed: ', error);
    }
  }
}

function loadFromLocalStorage(documentName) {
  editor.render(JSON.parse(localStorage["ytnt_"+documentName]).editorData)
  notesNameTextElement.value = documentName
  currentDocumentName = documentName
  autoSaveElement.innerText = "AutoSave On"
  introTextElement.style = "display:none"
  vidAndEditorElement.style = "display:block"
  offCanvasSavedBootstrap.hide()
}

var savedButtonElement = document.getElementById('savedButton')
var offCanvasSavedBootstrap = new bootstrap.Offcanvas(document.getElementById('offCanvasSaved')) // offCanvasSaved offCanvas element
savedButtonElement.addEventListener('click', () => {
  generateSavedNotes()
  offCanvasSavedBootstrap.show()
})

function deleteNote(documentName){
  var boolDel = window.confirm('Click OK to Delete')
  if (boolDel){
    localStorage.removeItem("ytnt_"+documentName)
    generateSavedNotes()
  }
}

function generateSavedNotes() {
  
  var savedNotesDivElement = document.getElementById('savedNotesDiv')
  var noSavedNotesElement = document.getElementById('noSavedNotes')
  if (savedNotesDivElement) {
    savedNotesDivElement.replaceChildren()
    noSavedNotesElement.style = "display:block"

    for (var lsItem in window.localStorage){
  
      if (lsItem.includes("ytnt_")){
        noSavedNotesElement.style = "display:none"
        var notesName = lsItem.substring(5)
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '12px';
        card.style.position = 'relative';
        card.innerHTML = `
          <div class="card-body">
            <p class="card-text">${notesName}</p>
            <div class="text-end">
              <a class="btn btn-sm btn-outline-secondary" onclick="deleteNote('${notesName}')">Delete Notes</a>
              <a class="btn btn-sm btn-outline-light" onclick="loadFromLocalStorage('${notesName}')">Load Notes</a>
            </div>
          </div>
        `;
        savedNotesDivElement.insertBefore(card, savedNotesDivElement.firstChild);
      }

    }
  }
}