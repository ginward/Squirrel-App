const INPUT_BUFFER_LENGTH = 4096;
const OUTPUT_BUFFER_LENGTH = 100000;
const OUTPUT_SAMPLE_RATE = 16000; //Unit: Hz
const SERVER_URL = "http://localhost:8080";
// Deal with prefixed APIs
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;

// Instantiating AudioContext
try {
    var audioContext = new AudioContext();
} catch (e) {
    console.log("Error initializing Web Audio");
}

var recorder;
var config = {
	inputBufferLength: INPUT_BUFFER_LENGTH,
	outputBufferLength: OUTPUT_BUFFER_LENGTH, 
	outputSampleRate: OUTPUT_SAMPLE_RATE
};
//Callback once the user authorizes access to the microphone:
function startUserMedia(stream) {
    var input = audioContext.createMediaStreamSource(stream);
    recorder = new AudioRecorder(input, config);
    // We can, for instance, add a recognizer as consumer
    if (recognizer) recorder.consumers.push(recognizer);
    recorder.start();
};

//the button to launch the recording
jQuery( document ).ready(function() {
	jQuery("#record").click(function(){
		// Actually call getUserMedia
		if (navigator.getUserMedia)
		    navigator.getUserMedia({audio: true},
		                           startUserMedia,
		                           function(e) {console.log("No live audio input in this browser");}
		                          );
		else console.log("No web audio support in this browser");
	});
});

var recognizer = {};
//the consumer that parse the audio data
recognizer.postMessage=function(cmd){
	if(cmd.command=="process"){
		var data = cmd.data;
		//send the data
		var oReq = new XMLHttpRequest();
		oReq.open("POST", SERVER_URL, true);
		oReq.onload = function (oEvent) {
		  // Uploaded.
		  console.log("uploaded");
		};
		var wav = arrayBufferToBase64(packageWAV(data));
		console.log(wav);
		oReq.send(wav);
	}
}

//function to package WAV data
function packageWAV(samples, mono){
  
  var buffer = new ArrayBuffer(44 + samples.length * 2);

  var view = new DataView(buffer);
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, mono?1:2, true);
  /* sample rate */
  view.setUint32(24, OUTPUT_SAMPLE_RATE, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, OUTPUT_SAMPLE_RATE * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return buffer;
}

function arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}