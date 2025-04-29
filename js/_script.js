

// document.querySelectorAll('.editable').forEach(span => {
//     span.removeEventListener('click')
// })


// stickies = [
//   {
//     t:'Hello!',
//     c:'World'
//   },
//   {
//     t:'Hello!',
//     c:'World'
//   },
//   {
//     t:'Hello!',
//     c:'World'
//   },
// ]


var msnry = new Masonry( '#masonryWrapper', {});





function loadFromLocalStorage(){
  stickies = JSON.parse(localStorage.getItem('stickyStorage'))
  for (var sticky of stickies){
    addSticky('initial',sticky.t,sticky.c)
  }
}

function saveToLocalStorage(){ // saves all the stickies to localStorage
  var cards = document.querySelectorAll('#masonryWrapper .card-contents')
  var cardsArray = []

  for (var card of cards){
    var cardTitle = card.querySelector('.card-title .editable').innerHTML;
    var cardText = card.querySelector('.card-text .editable').innerHTML;
    cardsArray.push({t:cardTitle,c:cardText})
  }

  localStorage.setItem('stickyStorage',JSON.stringify(cardsArray))
}

function addSticky(type,title,text){
  
  if (type == 'empty'){
    title = "📄";
    text = "Edit This"
  } else if (type == 'clipboard'){
    title = "📋";
  }

  var masonryWrapperElement = document.getElementById('masonryWrapper')
  var stickyHTML = 
  `<div class="card-body">
      <div class="d-flex justify-content-end">
        <button class="btn btn-sm btn-outline-secondary del-button" style="margin-left: 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
          </svg>
          Delete
        </button>
        <button class="btn btn-sm btn-outline-secondary copy-button" style="margin-left: 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
          </svg>
          Copy Body
        </button>
      </div>
      <div class="card-contents">
        <h5 class="card-title">
          <span class="editable" style="display:block"></span>
        </h5>
        <p class="card-text">
          <span class="editable" style="display:block"></span>
        </p>
      </div>
    </div>`
  var containerElement = document.createElement('div');
  containerElement.className = 'card align-self-start';
  var elementId = crypto.randomUUID()
  containerElement.id = elementId
  containerElement.style = "width: 20rem";
  containerElement.innerHTML = stickyHTML;
  containerElement.querySelector('.card-title .editable').innerHTML = title;
  containerElement.querySelector('.card-text .editable').innerHTML = text;
  containerElement.querySelector('.copy-button').onclick = function() {
    copyToClipboard(text);
  };
  containerElement.querySelector('.del-button').onclick = function() {
    deleteSticky(elementId);
  };
  
  containerElement.querySelectorAll('.editable').forEach(span => { // Add click event listener to all elements with class 'editable'
    span.addEventListener('click', function() {
      
      if (span.style.display === 'none') return; // Skip if already editing (prevents multiple inputs)

      const input = document.createElement('textarea'); // Create input field
      input.value = span.innerText;
      input.classList.add('w-100')

      span.style.display = 'none'; 
      span.parentNode.insertBefore(input, span); // Replace span with input
      input.focus();
      msnry.layout();

      input.addEventListener('blur', function() { // When user finishes editing (on blur)
          span.innerText = input.value;
          span.style.display = 'block';
          input.remove();
          msnry.layout();
          saveToLocalStorage();
      });

      input.addEventListener('keydown', function(event) { // When user finishes editing (Shift+Enter key)
        if (event.key === 'Enter' && event.shiftKey) {
          input.blur(); // Trigger blur to save on Shift+Enter
          }
      });
    });
  });
  
  masonryWrapperElement.appendChild(containerElement)
  msnry.appended(containerElement)
  msnry.layout();
  saveToLocalStorage()

}

function deleteSticky(stickyId){
  deleteElement = document.getElementById(stickyId)
  msnry.remove(deleteElement)
  deleteElement.remove()
  msnry.layout();
  saveToLocalStorage();
}

async function copyToClipboard(text){
  try {
    await navigator.clipboard.writeText(text); // Use the Clipboard API to write text
    console.log('Text copied successfully!')
  } catch (err) {
    console.error('Copy error:', err);
    // Common reasons: User denied permission, not in a secure context (HTTPS/localhost)
    if (err.name === 'NotAllowedError') {
        //  statusMessage.textContent = 'Clipboard write permission denied.';
    } else if (!window.isSecureContext) {
        //  statusMessage.textContent = 'Clipboard API requires a secure context (HTTPS or localhost).';
    }
  }
}

async function pasteFromClipboard(){

   try {
        // Use the Clipboard API to read text
        // This often requires explicit user permission the first time
        const textFromClipboard = await navigator.clipboard.readText();
        console.log('Text pasted successfully, ',textFromClipboard);
        addSticky('clipboard','',textFromClipboard)
    } catch (err) {
        // statusMessage.textContent = 'Failed to read clipboard contents.';
        console.error('Paste error:', err);
         // Common reasons: User denied permission, browser window/tab not focused,
         // not in a secure context (HTTPS/localhost)
         if (err.name === 'NotAllowedError') {
            //  statusMessage.textContent = 'Clipboard read permission denied.';
         } else if (!window.isSecureContext) {
            //  statusMessage.textContent = 'Clipboard API requires a secure context (HTTPS or localhost).';
         } else {
            //  statusMessage.textContent = 'Could not paste. Browser might require interaction or focus.';
         }
    }

}





  
loadFromLocalStorage()

