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

// Initial loading

if (/Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 500){
  offCanvasMobileDeviceBootstrap.show() // detecting mobile devices
}

const tag = document.createElement('script');
tag.src = `https://www.youtube.com/iframe_api?ts=${new Date().getTime()}`; // YT iframe api
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var currentASRBackend = localStorage.getItem('LS_asrBackend')
if (!currentASRBackend){
  currentASRBackend = 'asr_wsapi'
}

var currentYTNTMode = localStorage.getItem('LS_ytntMode')
if ((currentYTNTMode == null) || (currentYTNTMode == 'mode_yt')){ // normal (YouTube) mode
  document.getElementById('mode_yt').checked = true
  

} else if (currentYTNTMode == 'mode_no_yt'){ // general voice transcription mode
  document.getElementById('mode_no_yt').checked = true
  document.getElementById('loadVideoInputGroup').remove()
  document.getElementById('playPauseButton').remove()
  document.getElementById('back10Button').remove()
  document.getElementById('back30Button').remove()
  document.getElementById('forward5Button').remove()
  document.getElementById('distractionButton').remove()


  
  introTextElement.style = "display:none"
  vidAndEditorElement.style = "display:block"
  document.querySelector('.video-container').remove()
}

// Functions

function loadYTPlayer(videoId,startTime){
  if (videoId){
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
        'start': startTime ? startTime : 0
      },
      events: {
        'onReady': onPlayerReady,
        'onError': onPlayerError,
        'onStateChange': onPlayerStateChange
      },
    });
  }
}

function onPlayerStateChange(){ // saves video position when player state changes
  saveToLocalStorage()
}

setInterval(() => { // saves video position every 10 seconds when playing
  try {
    if (player.getPlayerState() == 1){
      saveToLocalStorage()
    }
  } catch {}
},10000);

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
    urlString = "https://www.youtube.com/watch?v=2KjW4BqNFy0"
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
    await editor.blocks.insert('header', {
      text: player.getVideoData().author + " - " + player.getVideoData().title
    },{}, editor.blocks.getBlocksCount(), false);
    await editor.blocks.insert('paragraph', {
      text: "https://www.youtube.com/watch?v="+ player.getVideoData().video_id
    },{}, editor.blocks.getBlocksCount(), false);
    await editor.blocks.insert('paragraph', {
      text: ""
    },{}, editor.blocks.getBlocksCount(), false);
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

// Events

loadVideoTextElement.addEventListener("keyup", ({key}) => { // listens for enter pressed
    if (key === "Enter") {
        loadVideoButtonElement.click()
    }
})

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
    if (currentDocumentName == ""){
      filename = 'YTNT - '+player.getVideoData().author + ' - ' + player.getVideoData().title
    } else {
      filename = currentDocumentName
    }
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





if (currentASRBackend == 'asr_wsapi'){

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    document.getElementById('interimTranscript').innerText = 'Your browser does not support Speech-to-Text. Try using Chrome or Edge. (Web Speech API not supported)'
    var requestVoicePermissionButtonElement =  document.getElementById('requestVoicePermissionButton')
    requestVoicePermissionButtonElement.remove()
  } 

  if (SpeechRecognition) {
    microphonePermissions()
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
      } catch {
        console.warn("using transcript shortcut that doesn't exist")
      }
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

}

if (currentASRBackend == 'asr_vb'){

  console.log('currentASRBackend == asr_vb')

//   async function init() {
//     //const model = await Vosk.createModel('model.tar.gz');
//     const model = await Vosk.createModel('./vosk_models/vosk-model-small-en-us-0.15.zip');
//     //const model = await Vosk.createModel('./vosk_models/vosk-model-small-en-us-0.15.tar.gz');

//     const recognizer = new model.KaldiRecognizer();
//     recognizer.on("result", (message) => {
//         console.log(`Result: ${message.result.text}`);
//     });
//     recognizer.on("partialresult", (message) => {
//         console.log(`Partial result: ${message.result.partial}`);
//     });
    
//     const mediaStream = await navigator.mediaDevices.getUserMedia({
//         video: false,
//         audio: {
//             echoCancellation: true,
//             noiseSuppression: true,
//             channelCount: 1,
//             sampleRate: 16000
//         },
//     });
    
//     const audioContext = new AudioContext();
//     const recognizerNode = audioContext.createScriptProcessor(4096, 1, 1)
//     recognizerNode.onaudioprocess = (event) => {
//         try {
//             recognizer.acceptWaveform(event.inputBuffer)
//         } catch (error) {
//             console.error('acceptWaveform failed', error)
//         }
//     }
//     const source = audioContext.createMediaStreamSource(mediaStream);
//     source.connect(recognizerNode);
// }

// window.onload = init;

// THIS CODE WORKS IN CHROME ONLY
// function createAudioWorkletModule() {
//     const processorCode = `
//         class VoiceProcessor extends AudioWorkletProcessor {
//             constructor() {
//                 super();
//             }
            
//             process(inputs, outputs, parameters) {
//                 const input = inputs[0];
                
//                 if (input.length > 0) {
//                     // Send the raw Float32Array input data to the main thread
//                     this.port.postMessage({
//                         type: 'audioData',
//                         audioData: input[0]
//                     });
//                 }
                
//                 return true; // Keep the processor alive
//             }
//         }
        
//         registerProcessor('voice-processor', VoiceProcessor);
//     `;
    
//     const blob = new Blob([processorCode], { type: 'application/javascript' });
//     return URL.createObjectURL(blob);
// }
// async function init() {
//     try {
//         const sampleRate = 16000;

//         // Load the model
//         const model = await Vosk.createModel('./vosk_models/vosk-model-small-en-us-0.15.zip');
        
//         // Create recognizer with the required sampleRate
//         const recognizer = new model.KaldiRecognizer(sampleRate);
        
//         // Set up event handlers
//         recognizer.on("result", (message) => {
//             console.log(`Result: ${message.result.text}`);
//         });
//         recognizer.on("partialresult", (message) => {
//             console.log(`Partial result: ${message.result.partial}`);
//         });
        
//         // Get media stream
//         const mediaStream = await navigator.mediaDevices.getUserMedia({
//             video: false,
//             audio: {
//                 echoCancellation: true,
//                 noiseSuppression: true,
//                 channelCount: 1,
//                 sampleRate: sampleRate
//             },
//         });
        
//         // Create audio context
//         const audioContext = new AudioContext({ sampleRate: sampleRate });
        
//         if (audioContext.state === 'suspended') {
//             await audioContext.resume();
//         }
        
//         if (audioContext.audioWorklet) {
//             try {
//                 await audioContext.audioWorklet.addModule(createAudioWorkletModule());
                
//                 const recognizerNode = new AudioWorkletNode(audioContext, 'voice-processor');
                
//                 // --- THIS IS THE FIX ---
//                 // Revert to creating an AudioBuffer, as this version of Vosk requires it.
//                 recognizerNode.port.onmessage = (event) => {
//                     try {
//                         if (event.data.type === 'audioData') {
//                             // Create AudioBuffer from the Float32Array data
//                             const audioData = event.data.audioData;
//                             const audioBuffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate);
//                             audioBuffer.copyToChannel(audioData, 0);
                            
//                             // Pass the newly created AudioBuffer to the recognizer
//                             recognizer.acceptWaveform(audioBuffer);
//                         }
//                     } catch (error) {
//                         console.error('acceptWaveform failed:', error);
//                     }
//                 };
                
//                 const source = audioContext.createMediaStreamSource(mediaStream);
//                 source.connect(recognizerNode);
                
//                 console.log('Voice recognition initialized successfully with AudioWorklet');
                
//             } catch (workletError) {
//                 console.warn('AudioWorklet failed, falling back to ScriptProcessor:', workletError);
//                 useScriptProcessor();
//             }
//         } else {
//             console.warn('AudioWorklet not supported, using ScriptProcessor');
//             useScriptProcessor();
//         }
        
//         // Fallback function using ScriptProcessor (this part was already correct)
//         function useScriptProcessor() {
//             const recognizerNode = audioContext.createScriptProcessor(4096, 1, 1);
            
//             recognizerNode.onaudioprocess = (event) => {
//                 try {
//                     recognizer.acceptWaveform(event.inputBuffer);
//                 } catch (error) {
//                     console.error('acceptWaveform failed:', error);
//                 }
//             };
            
//             const source = audioContext.createMediaStreamSource(mediaStream);
//             source.connect(recognizerNode);
            
//             const gainNode = audioContext.createGain();
//             gainNode.gain.value = 0;
//             recognizerNode.connect(gainNode);
//             gainNode.connect(audioContext.destination);
            
//             console.log('Voice recognition initialized successfully with ScriptProcessor');
//         }
        
//     } catch (error) {
//         console.error('Failed to initialize voice recognition:', error);
        
//         if (error.name === 'NotAllowedError') {
//             console.error('Microphone access denied. Please allow microphone access and try again.');
//         } else if (error.name === 'NotFoundError') {
//             console.error('No microphone found. Please connect a microphone and try again.');
//         } else if (error.message && error.message.includes('model')) {
//             console.error('Failed to load Vosk model. Please check the model path and file.');
//         }
//     }
// }
// document.addEventListener('DOMContentLoaded', init);

// Function to create the AudioWorklet processor module with robust, buffered resampling
function createAudioWorkletModule() {
    const processorCode = `
        class VoiceProcessor extends AudioWorkletProcessor {
            constructor(options) {
                super();
                this.inputSampleRate = options.processorOptions.inputSampleRate;
                this.outputSampleRate = options.processorOptions.outputSampleRate;
                this.resampleRatio = this.inputSampleRate / this.outputSampleRate;
                
                // Internal buffer to hold audio data between processing calls
                this.buffer = new Float32Array(0);
            }

            // This method combines the internal buffer with new data
            append(newData) {
                const oldData = this.buffer;
                this.buffer = new Float32Array(oldData.length + newData.length);
                this.buffer.set(oldData, 0);
                this.buffer.set(newData, oldData.length);
            }

            process(inputs, outputs, parameters) {
                const input = inputs[0];

                if (input.length > 0) {
                    // Append the new audio data to our internal buffer
                    this.append(input[0]);

                    // Calculate how many full output samples we can produce
                    const outputFrameCount = Math.floor(this.buffer.length / this.resampleRatio);

                    // If we can't produce a full sample, wait for more data
                    if (outputFrameCount === 0) {
                        return true;
                    }

                    // Create the output buffer and perform resampling
                    const outputData = new Float32Array(outputFrameCount);
                    for (let i = 0; i < outputFrameCount; i++) {
                        const inputIndex = i * this.resampleRatio;
                        const indexPrev = Math.floor(inputIndex);
                        const indexNext = Math.min(indexPrev + 1, this.buffer.length - 1);
                        const fraction = inputIndex - indexPrev;

                        // Linear interpolation for quality
                        outputData[i] = this.buffer[indexPrev] + (this.buffer[indexNext] - this.buffer[indexPrev]) * fraction;
                    }

                    // Calculate how many input samples were consumed
                    const consumedInputFrameCount = Math.ceil(outputFrameCount * this.resampleRatio);
                    
                    // Remove the consumed data from the internal buffer, keeping the leftovers
                    this.buffer = this.buffer.slice(consumedInputFrameCount);

                    // Send the resampled data back to the main thread
                    this.port.postMessage({
                        type: 'audioData',
                        audioData: outputData
                    });
                }
                
                return true; // Keep the processor alive
            }
        }
        
        registerProcessor('voice-processor', VoiceProcessor);
    `;
    
    const blob = new Blob([processorCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}

// Update the init function to get sample rate properly
async function init() {
    try {
        const voskSampleRate = 16000;

        // Load model
        const model = await Vosk.createModel('./vosk_models/vosk-model-small-en-us-0.15.zip');
        const recognizer = new model.KaldiRecognizer(voskSampleRate);
        
        recognizer.on("result", (message) => console.log(`Result: ${message.result.text}`));
        // recognizer.on("partialresult", (message) => console.log(`Partial result: ${message.result.partial}`));
        
        // Get media stream
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 1,
                sampleRate: voskSampleRate
            },
        });

        // Create AudioContext and get actual sample rate
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') await audioContext.resume();
        
        // Use audioContext's sample rate instead of track settings
        const actualSampleRate = audioContext.sampleRate;
        const source = audioContext.createMediaStreamSource(mediaStream);
        
        if (audioContext.audioWorklet) {
            await audioContext.audioWorklet.addModule(createAudioWorkletModule());
            
            const recognizerNode = new AudioWorkletNode(audioContext, 'voice-processor', {
                processorOptions: {
                    inputSampleRate: actualSampleRate,
                    outputSampleRate: voskSampleRate
                }
            });

            recognizerNode.port.onmessage = (event) => {
                try {
                    if (event.data.type === 'audioData') {
                        const audioData = event.data.audioData;
                        
                        // Skip empty buffers
                        if (audioData.length === 0) {
                            console.debug('Skipped empty audio buffer');
                            return;
                        }
                        
                        const audioBuffer = audioContext.createBuffer(1, audioData.length, voskSampleRate);
                        audioBuffer.copyToChannel(audioData, 0);
                        recognizer.acceptWaveform(audioBuffer);
                    }
                } catch (error) {
                    console.error('acceptWaveform failed:', error);
                }
            };
            
            source.connect(recognizerNode);
            console.log(`Voice recognition initialized. Native SR: ${actualSampleRate}, Vosk SR: ${voskSampleRate}.`);
        } else {
            console.error('AudioWorklet not supported');
        }
    } catch (error) {
        console.error('Initialization failed:', error);
        // Error handling remains the same
    }
}
document.addEventListener('DOMContentLoaded', init);




}



async function microphonePermissions(){

    var permissionStatusObject = await navigator.permissions.query({ name: 'microphone' })
    var permissionStatus = permissionStatusObject.state

    if (permissionStatus == 'denied'){
      document.getElementById('interimTranscript').innerHTML = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Allow the Microphone permission in your browser settings and reload the page to use this feature.'
      document.getElementById('requestVoicePermissionButton').remove()
    } else if (permissionStatus == 'prompt'){
      document.getElementById('interimTranscript').innerHTML = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Click "Request Microphone Permission" and allow to use this feature.'
      document.getElementById('voiceTransToggle').disabled = true;
      document.getElementById('voiceTransToggleText').innerText = 'Speech-to-Text Disabled'

      var requestVoicePermissionButtonElement =  document.getElementById('requestVoicePermissionButton')
      
      requestVoicePermissionButtonElement.addEventListener('click', async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          requestVoicePermissionButtonElement.remove()
          document.getElementById('interimTranscript').innerText = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech.'
          document.getElementById('voiceTransToggle').disabled = false;
          document.getElementById('voiceTransToggleText').innerHTML = 'Speech-to-Text Off <span class="gray">⌥5<span>'
        } catch (error) {
          document.getElementById('interimTranscript').innerHTML = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.<br><br>Allow the Microphone permission in your browser settings and reload the page to use this feature.'
          document.getElementById('requestVoicePermissionButton').remove()
        }
      })

    } else {
      document.getElementById('interimTranscript').innerText = 'Speech-to-Text uses your browser and device microphone to convert speech to text. Ensure that the video is playing loudly enough that your device can "hear" it. It will also convert your own speech. This is an experimental feature.'
      document.getElementById('voiceTransToggle').disabled = false;
      document.getElementById('voiceTransToggleText').innerHTML = 'Speech-to-Text Off <span class="gray">⌥5<span>'
      var requestVoicePermissionButtonElement =  document.getElementById('requestVoicePermissionButton')
      requestVoicePermissionButtonElement.remove()
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
      localStoragePayload.ytVideoId = player?.getVideoData()?.video_id
      localStoragePayload.ytVideoTime = Math.round(player?.getCurrentTime())
      localStoragePayload.version = 8
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
  lsPayload = JSON.parse(localStorage["ytnt_"+documentName])
  destroyYTPlayer()
  var ytVideoId = lsPayload.ytVideoId
  var ytVideoTime = lsPayload.ytVideoTime
  loadYTPlayer(ytVideoId,ytVideoTime)
  editor.render(lsPayload.editorData)
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

// Settings

var settingsButtonElement = document.getElementById('settingsButton')
var offCanvasSettingsBootstrap = new bootstrap.Offcanvas(document.getElementById('offCanvasSettings'))
settingsButtonElement.addEventListener('click', () => {
  offCanvasSettingsBootstrap.show()
})

var asrRadios = document.querySelectorAll('input[type="radio"][name="asrRadio"]');
asrRadios.forEach(asrRadio => {
    asrRadio.addEventListener('change', (event) => {
        if (event.target.checked) {
          localStorage.setItem('LS_asrBackend',event.target.id)
          window.location.reload()
        }
    });
});

var modeRadios = document.querySelectorAll('input[type="radio"][name="ytntMode"]');
modeRadios.forEach(modeRadio => {
    modeRadio.addEventListener('change', (event) => {
        if (event.target.checked) {
          localStorage.setItem('LS_ytntMode',event.target.id)
          window.location.reload()
        }
    });
});