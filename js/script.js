
// Globals

var player; // YT Player

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
      'cc_load_policy': 0,
      'cc_lang_pref':'en',
      'playsinline':1,
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
  try {
    var url = new URL(urlString);
    var urlParams = new URLSearchParams(url.search);
    return urlParams.get('v');
  } catch (e) {
    return null
  }
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
      } else if (event.code === 'Digit2') {
        event.preventDefault();
        var currentTime = player.getCurrentTime();
        var newTime = Math.max(0, currentTime - 10);
        player.seekTo(newTime, true);
      } else if (event.code === 'Digit3') {
        event.preventDefault();
        var currentTime = player.getCurrentTime();
        var newTime = Math.max(0, currentTime - 30);
        player.seekTo(newTime, true);
      } else if (event.code === 'Digit4') {
        event.preventDefault();
        var currentTime = player.getCurrentTime();
        var newTime = Math.min(player.getDuration(), currentTime + 5);
        player.seekTo(newTime, true);
      }
    }
  }, true);
}

function onPlayerError(event) {
  console.log('Player error:', event.data);
}

var loadVideoButtonElement = document.getElementById('loadVideoButton')
var loadVideoTextElement = document.getElementById('loadVideoText')
var introTextElement = document.getElementById('introText')
var vidAndEditorElement = document.getElementById('vidAndEditor')

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
        placeholder: 'Start writing...'
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
  