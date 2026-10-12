/**
 * MediQueue Hospital Management System
 * Shared Clinical Queuing Engine & State Store
 * Handles: LocalStorage persistence, cross-tab sync, Web Audio chime synthesis,
 * speech synthesis announcements, and dynamic UI updates across all 6 screens.
 */

(function(global) {
  'use strict';

  const STORAGE_KEY = 'mediqueue_hospital_state';
  const SETTINGS_KEY = 'mediqueue_settings';

  // Realistic Initial Mock Data
  const DEFAULT_INITIAL_STATE = {
    activeCounter: {
      id: 'counter-1',
      name: 'Counter 01',
      department: 'General OPD',
      doctor: 'Dr. Sarah Jenkins, RN',
      room: 'Room 104 - Wing B',
      status: 'Active'
    },
    currentServing: {
      token: 'A-108',
      name: 'Eleanor Vance',
      mrn: 'MRN-8842-309',
      age: 48,
      gender: 'Female',
      department: 'General OPD',
      counter: 'Counter 01',
      doctor: 'Dr. Sarah Jenkins',
      status: 'In Consultation',
      triage: 'Urgent',
      joinedTime: '10:15 AM',
      elapsedSeconds: 520,
      notes: 'Severe migraine follow-up & blood pressure review'
    },
    patients: [
      {
        id: 'p-1',
        token: 'H-102',
        name: 'Marcus Thorne',
        mrn: 'MRN-1092-441',
        age: 62,
        gender: 'Male',
        department: 'General OPD',
        counter: 'Counter 01',
        doctor: 'Dr. Sarah Jenkins',
        status: 'Called',
        triage: 'Priority',
        joinedTime: '10:20 AM',
        waitTime: '14 min',
        notes: 'Elderly patient with mobility assistance requested'
      },
      {
        id: 'p-2',
        token: 'H-103',
        name: 'Sophia Patel',
        mrn: 'MRN-3301-921',
        age: 29,
        gender: 'Female',
        department: 'General OPD',
        counter: 'Counter 01',
        doctor: 'Dr. Sarah Jenkins',
        status: 'Waiting',
        triage: 'Normal',
        joinedTime: '10:25 AM',
        waitTime: '20 min',
        notes: 'Routine seasonal influenza screening'
      },
      {
        id: 'p-3',
        token: 'H-104',
        name: 'John Doe',
        mrn: 'MRN-9021-8842',
        age: 35,
        gender: 'Male',
        department: 'General OPD',
        counter: 'Counter 01',
        doctor: 'Dr. Sarah Jenkins',
        status: 'Waiting',
        triage: 'Normal',
        joinedTime: '10:30 AM',
        waitTime: '28 min',
        notes: 'Allergy consultation and prescription renewal'
      },
      {
        id: 'p-4',
        token: 'H-105',
        name: 'Aria Montgomery',
        mrn: 'MRN-7712-402',
        age: 52,
        gender: 'Female',
        department: 'General OPD',
        counter: 'Counter 01',
        doctor: 'Dr. Sarah Jenkins',
        status: 'Waiting',
        triage: 'Priority',
        joinedTime: '10:35 AM',
        waitTime: '34 min',
        notes: 'Post-operative wound dressing inspection'
      },
      {
        id: 'p-5',
        token: 'C-201',
        name: 'David Kim',
        mrn: 'MRN-5521-118',
        age: 71,
        gender: 'Male',
        department: 'Cardiology',
        counter: 'Counter 02',
        doctor: 'Dr. Maya Lin',
        status: 'Waiting',
        triage: 'Urgent',
        joinedTime: '10:38 AM',
        waitTime: '18 min',
        notes: 'Arrhythmia review and ECG baseline check'
      },
      {
        id: 'p-6',
        token: 'P-301',
        name: 'Emma Watson',
        mrn: 'MRN-4419-760',
        age: 7,
        gender: 'Female',
        department: 'Pediatrics',
        counter: 'Counter 03',
        doctor: 'Dr. James Wilson',
        status: 'Waiting',
        triage: 'Normal',
        joinedTime: '10:40 AM',
        waitTime: '12 min',
        notes: 'Pediatric immunizations'
      }
    ],
    completedCount: 42,
    patientSessionToken: 'H-104', // default active patient (John Doe)
    autoCallEnabled: false,
    tokenCounter: 106
  };

  class MediQueueEngine {
    constructor() {
      this.listeners = [];
      this.state = this.loadState();
      this.initCrossTabSync();
      this.initAudioContext();
    }

    loadState() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.patients && parsed.activeCounter) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('MediQueue: Failed to load from localStorage', e);
      }
      return JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notify();
      } catch (e) {
        console.warn('MediQueue: Failed to save to localStorage', e);
      }
    }

    resetState() {
      this.state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
      this.saveState();
      this.showToast('System Reset', 'Demo queue restored to baseline state.');
    }

    subscribe(callback) {
      this.listeners.push(callback);
      try {
        callback(this.state);
      } catch (e) {
        console.error(e);
      }
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }

    notify() {
      for (const cb of this.listeners) {
        try {
          cb(this.state);
        } catch (e) {
          console.error(e);
        }
      }
    }

    initCrossTabSync() {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.state = JSON.parse(e.newValue);
            this.notify();
          } catch (err) {
            console.error('Storage sync parse error:', err);
          }
        }
      });
    }

    // Audio & Speech Synthesis
    initAudioContext() {
      this.audioCtx = null;
    }

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    playHospitalChime(callback) {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          if (callback) callback();
          return;
        }

        const now = ctx.currentTime;
        // Two-tone airport/hospital chime: First note E5 (659.25Hz), second note C5 (523.25Hz)
        const notes = [
          { freq: 659.25, time: now, duration: 0.45 },
          { freq: 523.25, time: now + 0.35, duration: 0.7 }
        ];

        notes.forEach(({ freq, time, duration }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          // Subtle harmonics for realistic chime bell
          gain.gain.setValueAtTime(0.001, time);
          gain.gain.exponentialRampToValueAtTime(0.28, time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(time);
          osc.stop(time + duration);
        });

        if (callback) {
          setTimeout(callback, 800);
        }
      } catch (err) {
        console.warn('Audio chime playback error:', err);
        if (callback) callback();
      }
    }

    announce(text) {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('Speech synthesis error:', e);
        }
      }
    }

    triggerCallNotification(token, counterName) {
      const counter = counterName || this.state.activeCounter.name;
      this.playHospitalChime(() => {
        this.announce(`Attention please. Patient with token ${token}, please proceed to ${counter}.`);
      });
      this.showToast('Token Called: ' + token, `Please proceed to ${counter}`);
    }

    // Core Queuing Operations
    callNext() {
      // Find candidate to call
      // Priority: First 'Called' patient becomes 'In Consultation' (if active serving completes),
      // and next 'Waiting' patient becomes 'Called'
      const waitingPatients = this.state.patients.filter(p => p.status === 'Waiting');
      const calledPatients = this.state.patients.filter(p => p.status === 'Called');

      if (calledPatients.length > 0) {
        // Move current called patient into consultation
        const called = calledPatients[0];
        
        // Move old currently serving to completed
        if (this.state.currentServing) {
          this.state.completedCount++;
        }

        called.status = 'In Consultation';
        this.state.currentServing = { ...called, elapsedSeconds: 0 };
        this.state.patients = this.state.patients.filter(p => p.id !== called.id);

        // Next in line becomes called
        if (waitingPatients.length > 0) {
          const nextWaiting = waitingPatients[0];
          nextWaiting.status = 'Called';
          this.triggerCallNotification(nextWaiting.token, this.state.activeCounter.name);
        } else {
          this.triggerCallNotification(called.token, this.state.activeCounter.name);
        }
      } else if (waitingPatients.length > 0) {
        // No one was called, so call first waiting patient
        const nextWaiting = waitingPatients[0];
        nextWaiting.status = 'Called';
        this.triggerCallNotification(nextWaiting.token, this.state.activeCounter.name);
      } else {
        this.showToast('Queue Empty', 'No waiting patients in queue at this station.');
        return;
      }

      this.saveState();
    }

    reannounceCurrent() {
      const target = this.state.patients.find(p => p.status === 'Called') || this.state.currentServing;
      if (target) {
        this.triggerCallNotification(target.token, this.state.activeCounter.name);
      } else {
        this.showToast('No Active Call', 'No patient currently called to re-announce.');
      }
    }

    registerPatient(details) {
      const count = this.state.tokenCounter++;
      const prefix = details.department === 'Cardiology' ? 'C' : 
                     details.department === 'Pediatrics' ? 'P' : 
                     details.department === 'Orthopedics' ? 'O' : 'H';
      const token = `${prefix}-${count}`;

      const newPatient = {
        id: 'p-' + Date.now(),
        token: token,
        name: details.name || 'Walk-in Patient',
        mrn: details.mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`,
        age: parseInt(details.age) || 30,
        gender: details.gender || 'Other',
        department: details.department || 'General OPD',
        counter: details.counter || 'Counter 01',
        doctor: details.doctor || 'Dr. Sarah Jenkins',
        status: 'Waiting',
        triage: details.priority || 'Normal',
        joinedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waitTime: '15 min',
        notes: details.notes || 'Walk-in registration'
      };

      // Urgent priority goes higher in the waiting list
      if (newPatient.triage === 'Urgent') {
        const firstWaitingIndex = this.state.patients.findIndex(p => p.status === 'Waiting');
        if (firstWaitingIndex !== -1) {
          this.state.patients.splice(firstWaitingIndex, 0, newPatient);
        } else {
          this.state.patients.push(newPatient);
        }
      } else {
        this.state.patients.push(newPatient);
      }

      this.saveState();
      return newPatient;
    }

    joinQueueFromKiosk(formData) {
      const patient = this.registerPatient(formData);
      this.state.patientSessionToken = patient.token;
      this.saveState();
      return patient;
    }

    updatePatientStatus(id, newStatus) {
      const patient = this.state.patients.find(p => p.id === id);
      if (patient) {
        patient.status = newStatus;
        if (newStatus === 'Called') {
          this.triggerCallNotification(patient.token, patient.counter);
        } else if (newStatus === 'In Consultation') {
          this.state.currentServing = { ...patient, elapsedSeconds: 0 };
          this.state.patients = this.state.patients.filter(p => p.id !== id);
        } else if (newStatus === 'Completed') {
          this.state.completedCount++;
          this.state.patients = this.state.patients.filter(p => p.id !== id);
        }
        this.saveState();
      }
    }

    removePatient(id) {
      this.state.patients = this.state.patients.filter(p => p.id !== id);
      this.saveState();
      this.showToast('Patient Removed', 'Removed from active queue.');
    }

    setPatientSessionToken(token) {
      this.state.patientSessionToken = token;
      this.saveState();
    }

    getStats() {
      const waiting = this.state.patients.filter(p => p.status === 'Waiting').length;
      const called = this.state.patients.filter(p => p.status === 'Called').length;
      return {
        waitingCount: waiting,
        calledCount: called,
        totalQueue: waiting + called,
        completedCount: this.state.completedCount,
        avgWaitTime: '16 min',
        currentServingToken: this.state.currentServing ? this.state.currentServing.token : '--',
        nextCalledToken: (this.state.patients.find(p => p.status === 'Called') || this.state.patients.find(p => p.status === 'Waiting') || { token: '--' }).token
      };
    }

    // Modern Toast Notification
    showToast(title, message) {
      let toastContainer = document.getElementById('mediqueue-global-toast');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'mediqueue-global-toast';
        toastContainer.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none transition-all';
        document.body.appendChild(toastContainer);
      }

      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto flex items-start gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/60 max-w-sm transform translate-y-2 opacity-0 transition-all duration-300';
      toast.innerHTML = `
        <span class="material-symbols-outlined text-blue-400 text-[20px] mt-0.5">notifications_active</span>
        <div class="flex-1">
          <div class="font-semibold text-sm text-slate-100">${title}</div>
          <div class="text-xs text-slate-300 mt-0.5">${message}</div>
        </div>
      `;

      toastContainer.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  }

  // Instantiate Single Engine
  const engine = new MediQueueEngine();
  global.MediQueue = engine;

  // Global Floating Switcher & Integration Setup
  document.addEventListener('DOMContentLoaded', () => {
    injectGlobalSuiteBar();
    bindCommonNavigation();
    bindPageSpecificLogic();
  });

  /**
   * Universal Suite Switcher Bar
   * Displays on all screens so the user can fluidly jump between the 6 interfaces
   */
  function injectGlobalSuiteBar() {
    if (document.getElementById('mediqueue-suite-bar')) return;

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const isStaffSuite = ['staff_dashboard.html', 'queue_management.html', 'register_patient.html'].includes(currentFile);
    const isPatientSuite = ['patient_dashboard.html', 'join_queue.html', 'patient_queue_tracking.html'].includes(currentFile);

    const bar = document.createElement('aside');
    bar.id = 'mediqueue-suite-bar';
    bar.setAttribute('aria-label', 'Suite Navigation Quick Switcher');
    bar.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[9990] bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-[0_8px_32px_rgba(0,0,0,0.36)] rounded-full px-3 py-2 flex items-center gap-2 text-white text-xs select-none transition-all hover:bg-slate-900';

    bar.innerHTML = `
      <a href="index.html" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors font-medium text-slate-200" title="Hospital Portal Home">
        <span class="material-symbols-outlined text-[18px] text-blue-400">local_hospital</span>
        <span class="hidden sm:inline font-bold">MediQueue</span>
      </a>

      <div class="h-4 w-px bg-slate-700"></div>

      <!-- Staff Suite Dropdown/Links -->
      <div class="flex items-center gap-1">
        <a href="staff_dashboard.html" class="px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${currentFile === 'staff_dashboard.html' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'}" title="Staff Dashboard">
          <span class="material-symbols-outlined text-[16px]">space_dashboard</span>
          <span class="hidden md:inline">Dashboard</span>
        </a>
        <a href="queue_management.html" class="px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${currentFile === 'queue_management.html' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'}" title="Queue Operations">
          <span class="material-symbols-outlined text-[16px]">view_kanban</span>
          <span class="hidden md:inline">Queue Board</span>
        </a>
        <a href="register_patient.html" class="px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${currentFile === 'register_patient.html' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'}" title="Walk-in Patient Intake">
          <span class="material-symbols-outlined text-[16px]">person_add</span>
          <span class="hidden md:inline">Register</span>
        </a>
      </div>

      <div class="h-4 w-px bg-slate-700"></div>

      <!-- Patient Suite Links -->
      <div class="flex items-center gap-1">
        <a href="patient_dashboard.html" class="px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${currentFile === 'patient_dashboard.html' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'}" title="Patient Portal">
          <span class="material-symbols-outlined text-[16px]">account_circle</span>
          <span class="hidden md:inline">Patient</span>
        </a>
        <a href="join_queue.html" class="px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${currentFile === 'join_queue.html' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'}" title="Self-Service Kiosk">
          <span class="material-symbols-outlined text-[16px]">touch_app</span>
          <span class="hidden md:inline">Join Kiosk</span>
        </a>
        <a href="patient_queue_tracking.html" class="px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${currentFile === 'patient_queue_tracking.html' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'}" title="Live Queue Screen & Audio">
          <span class="material-symbols-outlined text-[16px]">sensors</span>
          <span class="hidden md:inline">Live Tracker</span>
        </a>
      </div>

      <div class="h-4 w-px bg-slate-700"></div>

      <!-- Sound & Reset -->
      <button id="btn-sound-test" class="px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1" title="Test Hospital Chime">
        <span class="material-symbols-outlined text-[16px] text-amber-400">notifications_active</span>
        <span class="hidden lg:inline">Chime</span>
      </button>

      <button id="btn-reset-demo" class="px-2 py-1.5 rounded-full hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors" title="Reset Demo Data">
        <span class="material-symbols-outlined text-[16px]">restart_alt</span>
      </button>
    `;

    document.body.appendChild(bar);

    document.getElementById('btn-sound-test')?.addEventListener('click', () => {
      engine.triggerCallNotification(engine.getStats().nextCalledToken, engine.state.activeCounter.name);
    });

    document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
      if (confirm('Reset hospital demo queue to default?')) {
        engine.resetState();
      }
    });
  }

  /**
   * Bind Existing Sidebar and Header Links
   */
  function bindCommonNavigation() {
    // Links with data-path
    document.querySelectorAll('[data-path]').forEach(link => {
      const path = link.getAttribute('data-path');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        switch (path) {
          case 'dashboard':
            window.location.href = 'staff_dashboard.html';
            break;
          case 'queue-management':
            window.location.href = 'queue_management.html';
            break;
          case 'register-patient':
            window.location.href = 'register_patient.html';
            break;
          case 'my-queue':
            window.location.href = 'patient_dashboard.html';
            break;
          case 'join-queue':
            window.location.href = 'join_queue.html';
            break;
          case 'history':
            window.location.href = 'patient_queue_tracking.html';
            break;
        }
      });
    });

    // Logo clicks go to portal home
    document.querySelectorAll('img[alt="MediQueue Logo"]').forEach(img => {
      const parent = img.closest('div');
      if (parent) {
        parent.style.cursor = 'pointer';
        parent.addEventListener('click', () => {
          window.location.href = 'index.html';
        });
      }
    });
  }

  /**
   * Page Specific Dynamic Logic & State Binding
   */
  function bindPageSpecificLogic() {
    const filename = window.location.pathname.split('/').pop() || 'index.html';

    if (filename === 'staff_dashboard.html') {
      setupStaffDashboard();
    } else if (filename === 'queue_management.html') {
      setupQueueManagement();
    } else if (filename === 'register_patient.html') {
      setupRegisterPatient();
    } else if (filename === 'patient_dashboard.html') {
      setupPatientDashboard();
    } else if (filename === 'join_queue.html') {
      setupJoinQueue();
    } else if (filename === 'patient_queue_tracking.html') {
      setupPatientQueueTracking();
    }
  }

  // 1. Staff Dashboard
  function setupStaffDashboard() {
    // Call next buttons
    document.querySelectorAll('button').forEach(btn => {
      const txt = btn.innerText || '';
      if (txt.includes('Call Next')) {
        btn.onclick = (e) => {
          e.preventDefault();
          engine.callNext();
        };
      } else if (txt.includes('Re-Announce')) {
        btn.onclick = (e) => {
          e.preventDefault();
          engine.reannounceCurrent();
        };
      } else if (txt.includes('+ Register Patient')) {
        btn.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'register_patient.html';
        };
      }
    });

    // Subscribe to engine state
    engine.subscribe((state) => {
      const stats = engine.getStats();

      // Update Next Called in header
      const headerNextEl = document.querySelector('header strong.font-label-numeric');
      if (headerNextEl) headerNextEl.textContent = stats.nextCalledToken;

      // Update Call Next button token text
      const callNextBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Call Next'));
      if (callNextBtn) {
        const strong = callNextBtn.querySelector('strong');
        if (strong) strong.textContent = stats.nextCalledToken;
      }

      // Update KPI cards if present
      const metricCards = document.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2 > div, .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 > div');
      if (metricCards.length >= 4) {
        // Patients waiting
        const waitingValue = metricCards[0].querySelector('.font-display-token, .font-headline-lg, .text-3xl, .text-4xl, strong, span.font-bold');
        if (waitingValue) waitingValue.textContent = stats.waitingCount;

        // Currently serving
        const servingValue = metricCards[2].querySelector('.font-display-token, .font-headline-lg, .text-3xl, .text-4xl, strong, span.font-bold');
        if (servingValue) servingValue.textContent = stats.currentServingToken;

        // Completed
        const completedValue = metricCards[3].querySelector('.font-display-token, .font-headline-lg, .text-3xl, .text-4xl, strong, span.font-bold');
        if (completedValue) completedValue.textContent = stats.completedCount;
      }

      // Update Sidebar queue count
      const sidebarWaitEl = document.querySelector('aside .font-title-md.text-primary.font-bold');
      if (sidebarWaitEl) {
        sidebarWaitEl.textContent = `${stats.waitingCount} In Waiting`;
      }
    });
  }

  // 2. Queue Management
  function setupQueueManagement() {
    const mainCallBtn = document.getElementById('mainCallNextBtn');
    if (mainCallBtn) {
      mainCallBtn.onclick = (e) => {
        e.preventDefault();
        engine.callNext();
      };
    }

    const autoCallToggle = document.getElementById('autoCallToggle');
    const autoCallStatus = document.getElementById('autoCallStatus');
    const autoCallPin = document.getElementById('autoCallPin');

    let autoInterval = null;
    if (autoCallToggle) {
      autoCallToggle.onclick = () => {
        engine.state.autoCallEnabled = !engine.state.autoCallEnabled;
        if (engine.state.autoCallEnabled) {
          autoCallToggle.classList.remove('bg-surface-container-highest');
          autoCallToggle.classList.add('bg-primary');
          autoCallPin.classList.remove('translate-x-0.5');
          autoCallPin.classList.add('translate-x-5');
          if (autoCallStatus) autoCallStatus.textContent = 'Active (Every 20s)';
          engine.showToast('Auto-Call Active', 'System will automatically call the next patient.');
          autoInterval = setInterval(() => {
            if (engine.state.autoCallEnabled) engine.callNext();
          }, 20000);
        } else {
          autoCallToggle.classList.add('bg-surface-container-highest');
          autoCallToggle.classList.remove('bg-primary');
          autoCallPin.classList.add('translate-x-0.5');
          autoCallPin.classList.remove('translate-x-5');
          if (autoCallStatus) autoCallStatus.textContent = 'Inactive (Manual)';
          clearInterval(autoInterval);
        }
      };
    }

    // Subscribe to update main table
    engine.subscribe((state) => {
      const stats = engine.getStats();
      if (mainCallBtn) {
        mainCallBtn.querySelector('.font-label-lg').textContent = `Call Next Patient (${stats.nextCalledToken})`;
      }

      // Re-populate or sync table body if exists
      const tableBody = document.getElementById('queueTableBody');
      if (tableBody) {
        renderQueueTable(tableBody, state.patients);
      }
    });
  }

  function renderQueueTable(tableBody, patients) {
    tableBody.innerHTML = '';
    patients.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-surface-container-high/40 hover:bg-surface-container-low/40 transition-colors';
      tr.setAttribute('data-status', p.status.toLowerCase().replace(/\s+/g, '-'));

      const statusBadge = p.status === 'In Consultation' ? 
        `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">In Progress</span>` :
        p.status === 'Called' ?
        `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">Called</span>` :
        `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Waiting</span>`;

      tr.innerHTML = `
        <td class="py-3 px-4 font-mono font-bold text-sm text-primary">${p.token}</td>
        <td class="py-3 px-4 font-medium text-on-surface">
          <div>${p.name}</div>
          <div class="text-xs text-on-surface-variant">${p.mrn} • Age ${p.age}</div>
        </td>
        <td class="py-3 px-4 text-xs font-medium text-on-surface-variant">${p.department}</td>
        <td class="py-3 px-4 text-xs text-on-surface-variant">${p.waitTime || '12m'}</td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm" onclick="MediQueue.updatePatientStatus('${p.id}', 'Called')">
              Call
            </button>
            <button class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary-container text-on-secondary-container hover:opacity-90 transition-opacity" onclick="MediQueue.updatePatientStatus('${p.id}', 'In Consultation')">
              Serve
            </button>
            <button class="px-2 py-1 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100" onclick="MediQueue.updatePatientStatus('${p.id}', 'Completed')">
              Done
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // 3. Register Patient
  function setupRegisterPatient() {
    const regForm = document.getElementById('registrationForm');
    if (regForm) {
      regForm.onsubmit = (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName')?.value || 'Walk-in Patient';
        const patientAge = document.getElementById('patientAge')?.value || 35;
        const patientGender = document.getElementById('patientGender')?.value || 'Other';
        const mrn = document.getElementById('mrnNumber')?.value || '';
        const notes = document.getElementById('triageNotes')?.value || '';

        const newPatient = engine.registerPatient({
          name: fullName,
          age: patientAge,
          gender: patientGender,
          mrn: mrn,
          notes: notes,
          department: 'General OPD',
          priority: 'Normal'
        });

        // Update displays
        const displayToken = document.getElementById('displayTokenNumber');
        const slipToken = document.getElementById('slipToken');
        if (displayToken) displayToken.innerText = newPatient.token;
        if (slipToken) slipToken.innerText = newPatient.token;

        const summaryName = document.getElementById('summaryPatientName');
        const summaryMeta = document.getElementById('summaryPatientMeta');
        if (summaryName) summaryName.innerText = newPatient.name;
        if (summaryMeta) summaryMeta.innerText = `Age ${newPatient.age} • ${newPatient.gender} • ${newPatient.mrn}`;

        engine.showToast('Patient Registered', `Token ${newPatient.token} created and placed in live queue.`);
      };
    }
  }

  // 4. Patient Dashboard
  function setupPatientDashboard() {
    engine.subscribe((state) => {
      const sessionToken = state.patientSessionToken;
      const patient = state.patients.find(p => p.token === sessionToken) || {
        token: sessionToken,
        department: 'General OPD',
        counter: 'Counter 01',
        status: 'Waiting'
      };

      // Calculate position in queue
      const waitingList = state.patients.filter(p => p.status === 'Waiting');
      const position = waitingList.findIndex(p => p.token === sessionToken);
      const patientsAhead = position !== -1 ? position : 2;

      // Update display token
      const tokenEl = document.querySelector('.font-display-token');
      if (tokenEl) tokenEl.textContent = patient.token;

      // Update counters ahead
      const aheadEl = Array.from(document.querySelectorAll('span, strong')).find(el => (el.innerText || '').includes('Patients Ahead'));
      if (aheadEl) {
        const parent = aheadEl.closest('div');
        const countSpan = parent?.querySelector('.font-headline-sm, .text-xl, .font-bold');
        if (countSpan) countSpan.textContent = patientsAhead;
      }
    });

    // Make Quick Action buttons work
    document.querySelectorAll('button, a').forEach(el => {
      const txt = (el.innerText || '').toLowerCase();
      if (txt.includes('join queue')) {
        el.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'join_queue.html';
        };
      } else if (txt.includes('track') || txt.includes('view live queue')) {
        el.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'patient_queue_tracking.html';
        };
      }
    });
  }

  // 5. Join Queue
  function setupJoinQueue() {
    window.navigateToLiveTracking = function() {
      window.location.href = 'patient_queue_tracking.html';
    };

    // Enhance form submit or button click
    const submitBtn = document.querySelector('button[onclick*="triggerJoinQueue"], form button[type="submit"]');
    if (submitBtn) {
      const originalHandler = submitBtn.onclick;
      submitBtn.onclick = function(e) {
        // Collect form data
        const nameInput = document.querySelector('input[type="text"]');
        const name = nameInput ? nameInput.value : 'Visitor';
        
        const registered = engine.joinQueueFromKiosk({
          name: name || 'Self-Service Patient',
          age: 32,
          department: 'General OPD',
          priority: 'Normal'
        });

        // Update token badge in modal
        const modalToken = document.querySelector('#successModal .font-display-token, #successModal strong.text-primary');
        if (modalToken) modalToken.textContent = registered.token;

        if (originalHandler) {
          originalHandler.call(this, e);
        } else if (typeof triggerJoinQueue === 'function') {
          triggerJoinQueue();
        }
      };
    }
  }

  // 6. Patient Queue Tracking
  function setupPatientQueueTracking() {
    engine.subscribe((state) => {
      const stats = engine.getStats();
      const sessionToken = state.patientSessionToken;

      // Update Now Serving Token
      const servingTokens = document.querySelectorAll('.font-display-hero, .font-display-token, #nowServingToken');
      servingTokens.forEach(el => {
        if (el.closest('.bg-primary-container') || el.closest('#servingPanel') || (el.innerText || '').includes('A-') || (el.innerText || '').includes('H-')) {
          el.textContent = stats.currentServingToken;
        }
      });

      // Update My Token
      const myTokenEls = document.querySelectorAll('.font-display-token, #myTicketToken');
      myTokenEls.forEach(el => {
        if (!el.closest('.bg-primary-container') && !el.closest('#servingPanel')) {
          el.textContent = sessionToken;
        }
      });

      // Check if session token was called
      if (stats.nextCalledToken === sessionToken || stats.currentServingToken === sessionToken) {
        const statusBanner = document.getElementById('trackingStatusBanner');
        if (statusBanner) {
          statusBanner.className = 'p-4 rounded-2xl bg-amber-400 text-slate-900 font-bold flex items-center justify-between animate-bounce shadow-xl';
          statusBanner.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-2xl">campaign</span>
              <span>IT'S YOUR TURN! PLEASE PROCEED TO COUNTER 01</span>
            </div>
            <button onclick="MediQueue.playHospitalChime()" class="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs">Hear Chime</button>
          `;
        }
      }
    });
  }

})(window);
