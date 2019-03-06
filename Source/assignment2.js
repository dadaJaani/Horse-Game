/*
CS 465 - Computer Graphics
Assignment 2 - Hierarchical Modelling with a Quadruped Animal

Waqas Rehmani
21424884

This is the JavaScript file for the Quadruped Animal Assignment.
It uses hierarchical modelling and animations using transformations.
This file initalizes the WebGL and menu.

Also, a large part of the code used here was learned from the humanoid figure
example given with the course material.

*/


// ========================================================================
// Initalizing the global variables
// ========================================================================
var canvas
var gl

var projectionMatrix
var modelViewMatrix
var instanceMatrix
var modelViewMatrixLoc

var vertices = [
  vec4( -0.5, -0.5, 0, 1.0 ),
  vec4( -0.5,  0.5, 0, 1.0 ),
  vec4(  0.5,  0.5, 0, 1.0 ),
  vec4(  0.5, -0.5, 0, 1.0 ),
]
// Setting the IDs for our ease
var torsoId         = 0
var neckId          = 1
var leftFrontLegId  = 2
var rightFrontLegId = 3
var leftBackLegId   = 4
var rightBackLegId  = 5
var headId          = 6
var tailId          = 7
// Setting the dimensions of body parts
var torsoHeight    = 3.5
var torsoWidth     = 8.0
var frontLegHeight = 5.0
var frontLegWidth  = 0.5
var backLegWidth   = 0.5
var backLegHeight  = 5.0
var neckHeight     = 4
var neckWidth      = 1.7
var headHeight     = 3.5
var headWidth      = 1.2
var tailHeight     = 5
var tailWidth      = 0.5

// Number of nodes in the hierarchy
var numNodes = 8
// The angles for the legs, head and tail
var theta        = [0, -25, 180, 180, 180, 180, -90, 150]
var thetaDefault = [0, -25, 180, 180, 180, 180, -90, 150]

var stack
var figure

var vBuffer
var modelViewLoc

var pointsArray

// Some variables used for animations
var zoom = -70
var horizontalPosition = 0
var verticalPosition = -0.1
var horizontalSpeed = 0.5
var rotationSpeed = 1
var atEnd = false
var useKeyboard = true
var isWalking = false
var isRunning = false
var isJumping = false
var isCustomAnimating = false
var isMoveTypeRun = false

var neckRotationCC = false
var leftFrontLegRotationCC = true
var rightFrontLegRotationCC = true
var legForward = true
var facingRight = true
var goUp = true

// Variables to save animation data
var keyframesArray = []
var animateData
var currentAnimateData
var storage = window.localStorage;


// ========================================================================
//  Defining side menu controls
// ========================================================================

// This function resizes the elements of the page when we resize the window
window.onresize = function(event) {
  canvas = document.getElementById( 'gl-canvas' )
  side = document.getElementById( 'side-menu' )
  side.setAttribute("style","width:250px")
  canvas.height = window.innerHeight
  canvas.width = window.innerWidth - side.offsetWidth
}

// This function is run when the page loads the first time.
window.onload = function() {
  // Setting the sizes for the canvas and menu
  canvas = document.getElementById( 'gl-canvas' )
  side = document.getElementById( 'side-menu' )
  sideLeft = document.getElementById( 'side-menu-left' )
  side.setAttribute("style","width:250px")
  sideLeft.setAttribute("style","width:250px")
  canvas.height = window.innerHeight
  canvas.width = window.innerWidth - 2*side.offsetWidth
  canvas.style.position = "absolute";
  canvas.style.left = side.offsetWidth+"px"

  // This method initalizes the vertices using mouse events
  start()
  // This method initalizes the menu
  initializeMenu()
}

// ==========================================================================
//  INITALIZING THE MENU
// ==========================================================================
initializeMenu = () => {

  // ========================================================================
  //  Sliders for body parts
  // ========================================================================
  // Getting the sliders
  var lflegRot = document.getElementById( 'lflegRot' )
  var rflegRot = document.getElementById( 'rflegRot' )
  var lblegRot = document.getElementById( 'lblegRot' )
  var rblegRot = document.getElementById( 'rblegRot' )
  var neckRot = document.getElementById( 'neckRot' )
  var headRot = document.getElementById( 'headRot' )
  var tailRot = document.getElementById( 'tailRot' )
  var zoomSlider = document.getElementById( 'zoomSlider' )
  var horizontalPositionSlider = document.getElementById('horizontalPosition')
  var horizontalSpeedSlider = document.getElementById( 'horizontalSpeed' )
  var rotationSpeedSlider = document.getElementById( 'rotationSpeed' )

  // Setting the sliders input
  lflegRot.oninput = () => {
    theta[leftFrontLegId] = parseInt(event.srcElement.value)
    initNodes(leftFrontLegId)
  }
  rflegRot.oninput = () => {
    theta[rightFrontLegId] = parseInt(event.srcElement.value)
    initNodes(rightFrontLegId)
  }
  lblegRot.oninput = () => {
    theta[leftBackLegId] = parseInt(event.srcElement.value)
    initNodes(leftBackLegId)
  }
  rblegRot.oninput = () => {
    theta[rightBackLegId] = parseInt(event.srcElement.value)
    initNodes(rightBackLegId)
  }
  neckRot.oninput = () => {
    theta[neckId] = parseInt(event.srcElement.value)
    initNodes(neckId)
  }
  headRot.oninput = () => {
    theta[headId] = parseInt(event.srcElement.value)
    initNodes(headId)
  }
  tailRot.oninput = () => {
    theta[tailId] = parseInt(event.srcElement.value)
    initNodes(tailId)
  }

  zoomSlider.value = zoom
  zoomSlider.oninput = () => {
    horizontalPositionSlider.max = -zoom - 8
    horizontalPositionSlider.min = zoom + 8
    window.cancelAnimationFrame(animFrame)
    zoom = parseInt(event.srcElement.value)
    document.getElementById( 'zoomLabel' ).innerHTML = zoom
    start()
  }

  horizontalPositionSlider.max = -zoom - 8
  horizontalPositionSlider.min = zoom + 8

  horizontalPositionSlider.oninput = () => {
    horizontalPosition = parseInt(event.srcElement.value)
    initNodes(torsoId)
  }

  horizontalSpeedSlider.oninput = () => {
    document.getElementById('horizontal-speed-label').innerHTML = event.srcElement.value
    horizontalSpeed = parseFloat(event.srcElement.value)
  }
  rotationSpeedSlider.oninput = () => {
    document.getElementById('rotation-speed-label').innerHTML = event.srcElement.value
    rotationSpeed = parseFloat(event.srcElement.value)
  }


  lflegRot.value = theta[leftFrontLegId]
  rflegRot.value = theta[rightFrontLegId]
  lblegRot.value = theta[leftBackLegId]
  rblegRot.value = theta[rightBackLegId]
  neckRot.value = theta[neckId]
  headRot.value = theta[headId]
  horizontalSpeedSlider.value = horizontalSpeed
  rotationSpeedSlider.value = rotationSpeed
  document.getElementById('horizontal-speed-label').innerHTML = horizontalSpeed
  document.getElementById('rotation-speed-label').innerHTML = rotationSpeed


  // ========================================================================
  //  Switch between walk and run
  // ========================================================================
  // Getting the switch and it's label
  var moveTypeSwitch = document.getElementById('move-type-switch')
  var moveTypeLabel = document.getElementById('move-type-label')

  // This function called tp switch between running and walking
  moveTypeSwitch.onchange = function() {
    if (moveTypeSwitch.checked) {
      isMoveTypeRun = true
      theta[neckId] = - 50
      theta[tailId] = 105
      moveTypeLabel.innerHTML = 'Run'
    } else {
      isMoveTypeRun = false
      theta[neckId] = - 25
      theta[tailId] = 150

      theta[leftBackLegId] = 180
      theta[rightBackLegId] = 180
      theta[leftFrontLegId] = 180
      theta[rightFrontLegId] = 180

      neckRotationCC = false
      leftFrontLegRotationCC = true
      leftLowerFrontLegRotationCC = true
      rightFrontLegRotationCC = true
      rightLowerFrontLegRotationCC = true
      legForward = true
      moveTypeLabel.innerHTML = 'Walk'
    }
  }

  var keyboardSwitch = document.getElementById('keyboard-switch')
  var keyboardLabel = document.getElementById('keyboard-label')

  // This function called when switch input changes
  keyboardSwitch.onchange = function() {
    if (keyboardSwitch.checked) {
      useKeyboard = true
      keyboardLabel.innerHTML = 'Active'
    } else {
      useKeyboard = false
      keyboardLabel.innerHTML = 'Inactive'
    }
  }

  // ========================================================================
  //  Loading the information into the List
  // ========================================================================
  // Initalizing the list item that is selected
  var selectedItem = document.getElementById('selectedItem')
  // If the storage is not null, then make the list
  if (JSON.parse(storage.getItem("animal"))) {
    var storageNames = Object.keys(JSON.parse(storage.getItem("animal")))
    for (var i = 0; i<storageNames.length; i++){
      console.log();
      let div = document.createElement("div")
      div.classList.add('list-item')
      div.innerHTML = storageNames[i]
      document.getElementById("list-wrapper").appendChild(div);
    }
  }

  var saveKeyframeButton = document.getElementById('save-keyframe-button')
  var keyframeNumber = document.getElementById('keyframeLabel')
  // Function called when save button is pressed
  saveKeyframeButton.onclick = (e) => {
    let thetaSave = []
    for (var i = 0; i < theta.length; i++) {
      thetaSave.push(theta[i]);
    }
    keyframesArray.push({
      theta: thetaSave,
      horizontalPosition,
      verticalPosition,
      horizontalSpeed,
      rotationSpeed,
    })
    keyframeNumber.innerHTML = "# of keyframes: " + keyframesArray.length

  }
  // ========================================================================
  //  Saving the Animation
  // ========================================================================
  // Initalizing Save button
  var saveButton = document.getElementById('save-button')

  saveButton.onclick = (e) => {

    if ( keyframesArray.length !== 0 ){
      // Asks user for the name
      let name = prompt("Please enter the name for your customized animation");
      if (name == null || name == "") {
        // If there is no name, does not save
        keyframeNumber.innerHTML = "Please type a name to save!"
        window.alert("Please type a name to save!")
      } else {
        // Create data
        let saveData = keyframesArray
        // Merge data with previous data
        let toSave = JSON.parse(storage.getItem("animal"))

        if (!JSON.parse(storage.getItem("animal"))) {
          // If there is no previous data, then initialize the variable.
          toSave = {}
        }
        toSave[name] = saveData
        // Save the total data to local storage
        storage.setItem('animal', JSON.stringify(toSave));

        // CREATE ITEM IN THE LIST!
        let div = document.createElement("div")
        div.classList.add('list-item')
        div.innerHTML = name
        document.getElementById("list-wrapper").appendChild(div);
        // Function when item in list is selected
        div.onclick = (e) => {
          e.preventDefault()
          selectedItem.innerHTML = name
        }
        keyframeNumber.innerHTML = "Animation saved"
      }
    } else {
      keyframeNumber.innerHTML = "Add a keyframe first."
      window.alert("Add a keyframe first to save it.")
    }
  }

  // ========================================================================
  //  Loading the information
  // ========================================================================
  // Getting the List Items
  var listItems = document.getElementsByClassName('list-item')
  // Defining the onclick function for each of them
  for (var i = 0; i < listItems.length; i++) {
    let itemName = listItems[i].innerHTML
    listItems[i].onclick = (e) => {
      e.preventDefault()
      selectedItem.innerHTML = itemName
    }
  }

  // // Initalizing Load button
  var loadButton = document.getElementById('load-button')
  loadButton.onclick = (e) => {
    e.preventDefault()
    // Get the name from the displayed name
    let name = selectedItem.innerHTML
    if ( !name || name === "&nbsp;" ){
      // Error if no name is selected
      window.alert("Please select a carpet to load first.")
    } else {
      var loadData = JSON.parse(storage.getItem("animal"))
      // Initalize all the variables from the storage
      animateData = loadData[name].reverse();
      keyframeNumber.innerHTML = "'" + name + "' loaded.<br> Press Animate!"
    }
  }
  // Function to start the animation
  var animateButton = document.getElementById('animate-button')
  animateButton.onclick = (e) => {
    e.preventDefault()
    theta = thetaDefault
    horizontalPosition = 0
    verticalPosition = -0.1
    if (animateData && !isCustomAnimating) {
      isCustomAnimating = true
    }
  }
}

// ==========================================================================
//  INITALIZING THE KEYBOARD CONTROLS
// ==========================================================================
// Event Listener to start animation on key held down
document.addEventListener('keydown', function(event) {
  if (useKeyboard) {
    if(event.keyCode == 37) {
      if (facingRight) {
        uTurn()
      } else {
        if (isMoveTypeRun) {
          isRunning = true
        } else {
          isWalking = true
        }
      }
    }

    if(event.keyCode == 38) {
      verticalPosition = 0
      isJumping = true
    }

    else if(event.keyCode == 39) {
      if (!facingRight) {
        uTurn()
      } else {
        if (isMoveTypeRun) {
          isRunning = true
        } else {
          isWalking = true
        }
      }
    }
  }
})
// Event Listener to stop animation when key is released
document.addEventListener('keyup', function(event) {
  isWalking = false
  isRunning = false

})


scale4 = (a, b, c) => {
  var result = mat4();
  result[0][0] = a;
  result[1][1] = b;
  result[2][2] = c;
  return result;
}

// ==========================================================================
//  CREATE NODE FUNCTION
// ==========================================================================
createNode = (transform, render, sibling, child) => {
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;

}

// ==========================================================================
//  ANIMATION FUNCTIONS
// ==========================================================================
//  WALK FUNCTION
// ==========================================================================
walk = () => {
  var m = mat4()
  // If at end, stop
  if (horizontalPosition > -zoom - 7.5 || horizontalPosition < zoom + 7.5 ){
    atEnd = true;
  }
  // If at end, stop
  if (atEnd) {
    if (horizontalPosition > -zoom - 7.5 && !facingRight) {
      horizontalPosition -= 0.1
      atEnd = false
    } else if (horizontalPosition < zoom + 7.5 && facingRight) {
      horizontalPosition += 0.1
      atEnd = false
    }
  } else {
    // If horse facingRight, move right
    if (facingRight) {
      // Incrementing horizontal postion and
      // Adjusting angles
      horizontalPosition += 0.05

      if ( neckRotationCC ){
        theta[neckId] += 0.5
        theta[tailId] -= 0.14
      } else {
        theta[neckId] -= 0.5
        theta[tailId] += 0.14
      }
      if (legForward  ) {
        theta[leftFrontLegId] += 0.5
        theta[leftBackLegId] += 0.5
        theta[rightFrontLegId] -= 0.5
        theta[rightBackLegId] -= 0.5
      } else {
        theta[rightFrontLegId] += 0.5
        theta[rightBackLegId] += 0.5
        theta[leftBackLegId] -= 0.5
        theta[leftFrontLegId] -= 0.5
      }

      if ( theta[leftFrontLegId] < 160 ){
        neckRotationCC = true
      }
      else if (theta[leftFrontLegId] === 180 ) {
        neckRotationCC = false
      }
      else if (theta[leftFrontLegId] >= 200 ) {
        neckRotationCC = true
      }

      if ( theta[leftFrontLegId] < 160 ){
        legForward = true
      }
      else if (theta[leftFrontLegId] >= 200 ) {
        legForward = false
      }
      // translating the body to the right
      m = translate(horizontalPosition, verticalPosition, 0.0)
      figure[torsoId] = createNode( m, torso, null, neckId )
    }
    // If horse facing left, move left
    else {
      // Decrementing horizontal postion and
      // Adjusting angles
      horizontalPosition -= 0.05

      if ( neckRotationCC ){
        theta[neckId] += 0.5
        theta[tailId] -= 0.14
      } else {
        theta[neckId] -= 0.5
        theta[tailId] += 0.14
      }
      if (legForward  ) {
        theta[leftFrontLegId] += 0.5
        theta[leftBackLegId] += 0.5
        theta[rightFrontLegId] -= 0.5
        theta[rightBackLegId] -= 0.5
      } else {
        theta[rightFrontLegId] += 0.5
        theta[rightBackLegId] += 0.5
        theta[leftBackLegId] -= 0.5
        theta[leftFrontLegId] -= 0.5
      }

      if ( theta[leftFrontLegId] < 160 ){
        neckRotationCC = true
      }
      else if (theta[leftFrontLegId] === 180 ) {
        neckRotationCC = false
      }
      else if (theta[leftFrontLegId] >= 200 ) {
        neckRotationCC = true
      }

      if ( theta[leftFrontLegId] < 160 ){
        legForward = true
      }
      else if (theta[leftFrontLegId] >= 200 ) {
        legForward = false
      }
      // translating the body to the left
      m = translate(horizontalPosition, verticalPosition, 0.0)
      m = mult(m, scale4( -1, 1, 0))
      figure[torsoId] = createNode( m, torso, null, neckId )
    }

    // CREATING NODES WITH UPDATED TRANSFORMS
    m = translate(0.39*torsoWidth, 0.75*torsoHeight, 0.0);
    m = mult(m, rotate(theta[neckId], 0, 0, 1))
    figure[neckId] = createNode( m, neck, leftFrontLegId, headId);

    m = translate(-0.5*neckWidth, 1*neckHeight, 0.0);
    m = mult(m, rotate(theta[headId], 0, 0, 1))
    figure[headId] = createNode( m, head, null, null);

    m = translate((0.5*torsoWidth- 0.5*frontLegWidth)-.1, 0.5, 0.0);
    m = mult(m, rotate(theta[leftFrontLegId], 0, 0, 1));
    figure[leftFrontLegId] = createNode( m, leftFrontLeg, rightFrontLegId, null );

    m = translate( 0.5*torsoWidth - 0.5*frontLegWidth, 0.5, 0.0);
    m = mult(m, rotate(theta[rightFrontLegId], 0, 0, 1));
    figure[rightFrontLegId] = createNode( m, rightFrontLeg, leftBackLegId, null );

    m = translate(-(0.5*torsoWidth - 0.5*frontLegWidth-0.1), 0.5, 0.0);
    m = mult(m , rotate(theta[leftBackLegId], 0, 0, 1));
    figure[leftBackLegId] = createNode( m, leftBackLeg, rightBackLegId, null );

    m = translate(-(0.5*torsoWidth - 0.5*frontLegWidth), 0.5, 0.0);
  	m = mult(m, rotate(theta[rightBackLegId], 0, 0, 1));
    figure[rightBackLegId] = createNode( m, rightBackLeg, tailId, null );

    m = translate(-0.5*torsoWidth + 0.2 , 0.93*torsoHeight, 0.0);
    m = mult(m, rotate(theta[tailId], 0, 0, 1));
    figure[tailId] = createNode( m, tail, null, null );
  }
}

// ==========================================================================
//  JUMP FUNCTION
// ==========================================================================
jump = () => {

  if (goUp && isJumping) {
    if ( verticalPosition < 2 ) {
      verticalPosition += 0.5
    } else if (verticalPosition >= 2 && verticalPosition < 5) {
      verticalPosition += 0.3
    } else if (verticalPosition >= 5 && verticalPosition < 7) {
      verticalPosition += 0.17
    } else if (verticalPosition >= 7 && verticalPosition < 8) {
      verticalPosition += 0.12
    } else if (verticalPosition >= 8 && verticalPosition < 9) {
      verticalPosition += 0.09
    } else if (verticalPosition >= 9 && verticalPosition < 9.8) {
      verticalPosition += 0.07
    } else if (verticalPosition >= 9.8 ) {
      verticalPosition += 0.05
    }
  } else if (!goUp && isJumping) {
    if ( verticalPosition < 2 ) {
      verticalPosition -= 0.5
    } else if (verticalPosition >= 2 && verticalPosition < 5) {
      verticalPosition -= 0.3
    } else if (verticalPosition >= 5 && verticalPosition < 7) {
      verticalPosition -= 0.17
    } else if (verticalPosition >= 7 && verticalPosition < 8) {
      verticalPosition -= 0.12
    } else if (verticalPosition >= 8 && verticalPosition < 9) {
      verticalPosition -= 0.09
    } else if (verticalPosition >= 9 && verticalPosition < 9.8) {
      verticalPosition -= 0.07
    } else if (verticalPosition >= 9.8 ) {
      verticalPosition -= 0.05
    }
  }
  // If at top, go down, else go up
  if ( verticalPosition > 10 ) {
    goUp = false
  } else if (verticalPosition < 0 ) {
    goUp = true
    isJumping = false
  }

  // CREATING NODES WITH UPDATED TRANSFORMS
  var m = mat4()
  if (facingRight) {
    m = translate(horizontalPosition, verticalPosition, 0)
    figure[torsoId] = createNode( m, torso, null, neckId )
  } else {
    m = translate(horizontalPosition, verticalPosition, 0.0)
    m = mult(m, scale4( -1, 1, 0))
    figure[torsoId] = createNode( m, torso, null, neckId )
  }
}

// ==========================================================================
//  RUN FUNCTION
// ==========================================================================
run = () => {
  var m = mat4()

  if (horizontalPosition > -zoom - 7.5 || horizontalPosition < zoom + 7.5){
    atEnd = true;
  }

  if (atEnd) {
    if (horizontalPosition > -zoom - 7.5 && !facingRight) {
      horizontalPosition -= 0.6
      atEnd = false
    } else if (horizontalPosition < zoom + 7.5 && facingRight) {
      horizontalPosition += 0.6
      atEnd = false
    }
  } else {
    if (facingRight) {
      horizontalPosition += 0.6

      if ( neckRotationCC ){
        theta[neckId] += 1
        theta[tailId] -= 0.5
      } else {
        theta[neckId] -= 1
        theta[tailId] += 0.5
      }
      if (legForward  ) {
        theta[rightFrontLegId] += 2.1
        theta[rightBackLegId] -= 3.1
        theta[leftFrontLegId] += 3.1
        theta[leftBackLegId] -= 2.1

      } else {
        theta[rightFrontLegId] -= 2.1
        theta[rightBackLegId] += 3.1
        theta[leftFrontLegId] -= 3.1
        theta[leftBackLegId] += 2.1
      }

      if ( theta[leftFrontLegId] < 150 ){
        neckRotationCC = false
      }

      else if (theta[leftFrontLegId] >= 210 ) {
        neckRotationCC = true
      }
      if ( theta[leftFrontLegId] < 150 ){
        legForward = true
      }
      else if (theta[leftFrontLegId] >= 210 ) {
        legForward = false
      }
      m = translate(horizontalPosition, verticalPosition, 0.0)
      figure[torsoId] = createNode( m, torso, null, neckId )
    }

    else {
      horizontalPosition -= 0.6

      if ( neckRotationCC ){
        theta[neckId] += 1
        theta[tailId] -= 0.5
      } else {
        theta[neckId] -= 1
        theta[tailId] += 0.5
      }

      if (legForward  ) {
        theta[rightFrontLegId] += 2.1
        theta[rightBackLegId] -= 3.1
        theta[leftFrontLegId] += 3.1
        theta[leftBackLegId] -= 2.1
      } else {
        theta[rightFrontLegId] -= 2.1
        theta[rightBackLegId] += 3.1
        theta[leftFrontLegId] -= 3.1
        theta[leftBackLegId] += 2.1
      }

      if ( theta[leftFrontLegId] < 150 ){
        neckRotationCC = false
      }

      else if (theta[leftFrontLegId] >= 210 ) {
        neckRotationCC = true
      }
      if ( theta[leftFrontLegId] < 150 ){
        legForward = true
      }
      else if (theta[leftFrontLegId] >= 210 ) {
        legForward = false
      }

      // translating the body to the left
      m = translate(horizontalPosition, verticalPosition, 0.0)
      m = mult(m, scale4( -1, 1, 0))
      figure[torsoId] = createNode( m, torso, null, neckId )
    }

    // CREATING NODES WITH UPDATED TRANSFORMS
    m = translate(0.39*torsoWidth, 0.75*torsoHeight, 0.0);
    m = mult(m, rotate(theta[neckId], 0, 0, 1))
    figure[neckId] = createNode( m, neck, leftFrontLegId, headId);

    m = translate(-0.5*neckWidth, 1*neckHeight, 0.0);
    m = mult(m, rotate(theta[headId], 0, 0, 1))
    figure[headId] = createNode( m, head, null, null);

    m = mat4()
    m = translate((0.5*torsoWidth- 0.5*frontLegWidth)-.1, 0.5, 0.0);
    m = mult(m, rotate(theta[leftFrontLegId], 0, 0, 1));
    figure[leftFrontLegId] = createNode( m, leftFrontLeg, rightFrontLegId, null );

    m = translate( 0.5*torsoWidth - 0.5*frontLegWidth, 0.5, 0.0);
    m = mult(m, rotate(theta[rightFrontLegId], 0, 0, 1));
    figure[rightFrontLegId] = createNode( m, rightFrontLeg, leftBackLegId, null );

    m = translate(-(0.5*torsoWidth - 0.5*frontLegWidth-0.1), 0.5, 0.0);
    m = mult(m , rotate(theta[leftBackLegId], 0, 0, 1));
    figure[leftBackLegId] = createNode( m, leftBackLeg, rightBackLegId, null );

    m = translate(-(0.5*torsoWidth - 0.5*frontLegWidth), 0.5, 0.0);
  	m = mult(m, rotate(theta[rightBackLegId], 0, 0, 1));
    figure[rightBackLegId] = createNode( m, rightBackLeg, tailId, null );

    m = translate(-0.5*torsoWidth + 0.2 , 0.93*torsoHeight, 0.0);
    m = mult(m, rotate(theta[tailId], 0, 0, 1));
    figure[tailId] = createNode( m, tail, null, null );
  }
}

// ==========================================================================
//  CUSTOM ANIMATION FUNCTION
// ==========================================================================
customAnimation = () => {

  let animFinished = false;

  // Check if the keyframe stack is empty or not
  if (animateData.length > 0) {
    if (!currentAnimateData) {
      currentAnimateData = animateData.pop()
    }
  }
  // pop one transformation from the stack and then animate to it
   if (currentAnimateData) {
    for (var i = 0; i < theta.length; i++) {
      if ( Math.floor(theta[i]) > Math.floor(currentAnimateData.theta[i]) ) {
        theta[i] -= currentAnimateData.rotationSpeed;
      } else if ( Math.floor(theta[i])  < Math.floor(currentAnimateData.theta[i]) )  {
        theta[i] += currentAnimateData.rotationSpeed;
      } else { }
    }

    if ( Math.floor(horizontalPosition) > Math.floor(currentAnimateData.horizontalPosition) ) {
      horizontalPosition -= currentAnimateData.horizontalSpeed;
    } else if ( Math.floor(horizontalPosition) < Math.floor(currentAnimateData.horizontalPosition) )  {
      horizontalPosition += currentAnimateData.horizontalSpeed;
    } else { }


    // IF THE TRASFORMATION IS COMPLETE, THEN TAKE NEXT TRANSFORMATION
    let shouldMoveToNext = true
    for (var i = 0; i < theta.length; i++) {
      if ( Math.floor(theta[i]) !== Math.floor(currentAnimateData.theta[i]) ){
        shouldMoveToNext = false
      }
    }
    if ( Math.floor(horizontalPosition) !== Math.floor(currentAnimateData.horizontalPosition) ){
      shouldMoveToNext = false
    }
    if (shouldMoveToNext) {
      currentAnimateData = undefined
    }
    if (shouldMoveToNext && animateData.length === 0 ) {
      isCustomAnimating = false
      animateData = undefined
    }

  }

  // CREATING NODES WITH UPDATED TRANSFORMS
  var m = mat4()
  m = translate(horizontalPosition, verticalPosition, 0.0)
  figure[torsoId] = createNode( m, torso, null, neckId )

  m = translate(0.39*torsoWidth, 0.75*torsoHeight, 0.0);
  m = mult(m, rotate(theta[neckId], 0, 0, 1))
  figure[neckId] = createNode( m, neck, leftFrontLegId, headId);

  m = translate(-0.5*neckWidth, 1*neckHeight, 0.0);
  m = mult(m, rotate(theta[headId], 0, 0, 1))
  figure[headId] = createNode( m, head, null, null);

  m = translate((0.5*torsoWidth- 0.5*frontLegWidth)-.1, 0.5, 0.0);
  m = mult(m, rotate(theta[leftFrontLegId], 0, 0, 1));
  figure[leftFrontLegId] = createNode( m, leftFrontLeg, rightFrontLegId, null );

  m = translate( 0.5*torsoWidth - 0.5*frontLegWidth, 0.5, 0.0);
  m = mult(m, rotate(theta[rightFrontLegId], 0, 0, 1));
  figure[rightFrontLegId] = createNode( m, rightFrontLeg, leftBackLegId, null );

  m = translate(-(0.5*torsoWidth - 0.5*frontLegWidth-0.1), 0.5, 0.0);
  m = mult(m , rotate(theta[leftBackLegId], 0, 0, 1));
  figure[leftBackLegId] = createNode( m, leftBackLeg, rightBackLegId, null );

  m = translate(-(0.5*torsoWidth - 0.5*frontLegWidth), 0.5, 0.0);
	m = mult(m, rotate(theta[rightBackLegId], 0, 0, 1));
  figure[rightBackLegId] = createNode( m, rightBackLeg, tailId, null );

  m = translate(-0.5*torsoWidth + 0.2 , 0.93*torsoHeight, 0.0);
  m = mult(m, rotate(theta[tailId], 0, 0, 1));
  figure[tailId] = createNode( m, tail, null, null );
}

// ==========================================================================
//  U TURN FUNCTION to change facing direction
// ==========================================================================
uTurn = () => {
  if (facingRight) {
    var m =  mult(figure[torsoId].transform, scale4(-1, 1, 0))
    figure[torsoId] = createNode( m, torso, null, neckId );
    facingRight = false
  } else {
    var m =  mult(figure[torsoId].transform, scale4(-1, 1, 0))
    figure[torsoId] = createNode( m, torso, null, neckId );
    facingRight = true
  }
}

// ==========================================================================
//  FUNCTION to initialize nodes
// ==========================================================================
initNodes = (Id) => {
  var m = mat4();

  switch(Id) {
    case torsoId:
      m = translate(horizontalPosition, verticalPosition, 0.0)
      figure[torsoId] = createNode( m, torso, null, neckId );
      break;

    case neckId:
      m = translate(0.39*torsoWidth, 0.75*torsoHeight, 0.0);
      m = mult(m, rotate(theta[neckId], 0, 0, 1))
      figure[neckId] = createNode( m, neck, leftFrontLegId, headId);
      break;

    case headId:
      m = translate(-0.5*neckWidth, 1*neckHeight, 0.0);
      m = mult(m, rotate(theta[headId], 0, 0, 1))
      figure[headId] = createNode( m, head, null, null);
      break;

    case leftFrontLegId:
      m = translate((0.5*torsoWidth- 0.5*frontLegWidth)-.1, 0.5, 0.0);
      m = mult(m, rotate(theta[leftFrontLegId], 0, 0, 1));
      figure[leftFrontLegId] = createNode( m, leftFrontLeg, rightFrontLegId, null );
      break;

    case rightFrontLegId:
      m = translate( 0.5*torsoWidth - 0.5*frontLegWidth, 0.5, 0.0);
      m = mult(m, rotate(theta[rightFrontLegId], 0, 0, 1));
      figure[rightFrontLegId] = createNode( m, rightFrontLeg, leftBackLegId, null );
      break;

    case leftBackLegId:
      m = translate(-(0.5*torsoWidth - 0.5*frontLegWidth-0.1), 0.5, 0.0);
      m = mult(m , rotate(theta[leftBackLegId], 0, 0, 1));
      figure[leftBackLegId] = createNode( m, leftBackLeg, rightBackLegId,  null );
      break;

    case rightBackLegId:
      m = translate(-(0.5*torsoWidth - 0.5*frontLegWidth), 0.5, 0.0);
    	m = mult(m, rotate(theta[rightBackLegId], 0, 0, 1));
      figure[rightBackLegId] = createNode( m, rightBackLeg, tailId, null );
      break;

    case tailId:
      m = translate(-0.5*torsoWidth + 0.2 , 0.93*torsoHeight, 0.0);
    	m = mult(m, rotate(theta[tailId], 0, 0, 1));
      figure[tailId] = createNode( m, tail, null, null );
      break;
  }
}

// ==========================================================================
//  FUNCTION to traverse on hierarchy tree
// ==========================================================================
traverse = (Id) => {
  if(Id == null)
    return;

  stack.push(modelViewMatrix);
  modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
  figure[Id].render();

  if(figure[Id].child != null)
    traverse(figure[Id].child);

  modelViewMatrix = stack.pop();

  if(figure[Id].sibling != null)
    traverse(figure[Id].sibling);
}

// ==========================================================================
//  RENDER FUNCTIONS for each body part
// ==========================================================================
torso = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0) );
  instanceMatrix = mult(instanceMatrix, scale4( torsoWidth, torsoHeight, 0));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

neck = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * neckHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(neckWidth, neckHeight, neckWidth) );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

head = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0) );
  instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth) )
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

leftFrontLeg = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * frontLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(frontLegWidth, frontLegHeight, frontLegWidth) );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

rightFrontLeg = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * frontLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(frontLegWidth, frontLegHeight, frontLegWidth) );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

leftBackLeg = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * backLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(backLegWidth, backLegHeight, backLegWidth) );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

rightBackLeg = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * backLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(backLegWidth, backLegHeight, backLegWidth) );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

tail = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, 0) );
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

// ==========================================================================
//  RENDER FUNCTIONS to draw ground line
// ==========================================================================
drawLine = () => {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, -(0.4*torsoHeight + 0.7*backLegHeight), 0.0) );
  instanceMatrix = mult(instanceMatrix, scale4(2*zoom, 0.2, 2) )
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

square = () => {
  pointsArray.push(vertices[1]);
  pointsArray.push(vertices[0]);
  pointsArray.push(vertices[3]);
  pointsArray.push(vertices[2]);
}

// ==========================================================================
//  Initalizing GL things
// ==========================================================================
initGL = () => {
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0.0, 0.0, 0.0, 0.85 );

  program = initShaders( gl, "vertex-shader", "fragment-shader");

  gl.useProgram( program);

  instanceMatrix = mat4();
  projectionMatrix = ortho(zoom, -zoom, zoom, -zoom, -10.0, 10.0);
  modelViewMatrix = mat4();

  gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
  gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

  square();

  vBuffer = gl.createBuffer();

  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );
}

start = () => {
  stack = []
  figure = []
  pointsArray = []

  for (var i=0; i<numNodes; i++)
    figure[i] = createNode(null, null, null, null)

  initGL()

  for (var i=0; i<numNodes; i++)
    initNodes(i);

  render();
}

var animFrame

render = () => {
  gl.clear( gl.COLOR_BUFFER_BIT );
  // storage.removeItem('animal')

  if (isWalking) {
    walk()
  }
  if (isRunning) {
    run()
  }
  if (isJumping) {
    jump()
  }
  if (isCustomAnimating) {
    customAnimation()
  }

  traverse(torsoId);
  drawLine();
  animFrame = requestAnimFrame(render);

}

animFrame = requestAnimationFrame(render);
