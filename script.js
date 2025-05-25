class TalkingTim {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.stream = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudio();
    }
    
    initializeElements() {
        this.character = document.getElementById('tim');
        this.recordBtn = document.getElementById('recordBtn');
        this.status = document.getElementById('status');
        this.mouth = document.getElementById('mouth');
        this.voiceIndicator = document.getElementById('voiceIndicator');
    }
    
    setupEventListeners() {
        // Character interaction
        this.character.addEventListener('click', () => this.onCharacterClick());
        this.character.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onCharacterClick();
        });
        
        // Record button
        this.recordBtn.addEventListener('mousedown', () => this.startRecording());
        this.recordBtn.addEventListener('mouseup', () => this.stopRecording());
        this.recordBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        this.recordBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });
        
        // Prevent context menu on long press
        this.recordBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Audio context not supported:', error);
            this.updateStatus('Audio not supported on this device');
        }
    }
    
    onCharacterClick() {
        this.character.classList.add('bounce');
        this.playRandomSound();
        
        setTimeout(() => {
            this.character.classList.remove('bounce');
        }, 600);
    }
    
    playRandomSound() {
        const sounds = ['Meow!', 'Purr...', 'Mew mew!', 'Hello!'];
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        this.speakText(randomSound);
    }
    
    speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 1.5;
            utterance.rate = 1.2;
            utterance.volume = 0.8;
            
            utterance.onstart = () => {
                this.mouth.classList.add('talking');
            };
            
            utterance.onend = () => {
                this.mouth.classList.remove('talking');
            };
            
            speechSynthesis.speak(utterance);
        }
    }
    
    async startRecording() {
        if (this.isRecording) return;
        
        try {
            // Request microphone permission
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            this.isRecording = true;
            this.audioChunks = [];
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.start();
            this.updateUI(true);
            this.updateStatus('Recording... Release to stop');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.updateStatus('Microphone access denied');
        }
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        this.updateUI(false);
        this.updateStatus('Processing...');
    }
    
    async processRecording() {
        if (this.audioChunks.length === 0) {
            this.updateStatus('No audio recorded');
            return;
        }
        
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play back with pitch modification
            await this.playWithPitchShift(audioUrl);
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.updateStatus('Error processing audio');
        }
    }
    
    async playWithPitchShift(audioUrl) {
        try {
            const audio = new Audio(audioUrl);
            audio.playbackRate = 1.5; // Simple pitch shift
            audio.volume = 0.8;
            
            audio.onplay = () => {
                this.mouth.classList.add('talking');
                this.character.classList.add('bounce');
            };
            
            audio.onended = () => {
                this.mouth.classList.remove('talking');
                this.character.classList.remove('bounce');
                this.updateStatus('Tap Tim or hold the mic button!');
                URL.revokeObjectURL(audioUrl);
            };
            
            audio.onerror = () => {
                this.updateStatus('Error playing audio');
                URL.revokeObjectURL(audioUrl);
            };
            
            await audio.play();
            this.updateStatus('Tim is talking!');
            
        } catch (error) {
            console.error('Error playing audio:', error);
            this.updateStatus('Error playing audio');
        }
    }
    
    updateUI(recording) {
        if (recording) {
            this.recordBtn.classList.add('recording');
            this.recordBtn.querySelector('.btn-text').textContent = 'Recording...';
            this.voiceIndicator.classList.add('active');
        } else {
            this.recordBtn.classList.remove('recording');
            this.recordBtn.querySelector('.btn-text').textContent = 'Hold to Record';
            this.voiceIndicator.classList.remove('active');
        }
    }
    
    updateStatus(message) {
        this.status.textContent = message;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TalkingTim();
});

// Handle audio context resume for mobile browsers
document.addEventListener('touchstart', function() {
    if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
    }
}, { once: true });

