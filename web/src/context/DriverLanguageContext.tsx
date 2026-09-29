import React, { createContext, useContext, useState } from 'react';

export type DriverLanguage = 'en' | 'hi' | 'hinglish';

export interface Translations {
  // Navigation & General
  home: string;
  trip: string;
  map: string;
  emergency: string;
  more: string;
  vehicle: string;
  status: string;
  back: string;
  cancel: string;
  confirm: string;
  loading: string;
  gpsConnected: string;
  acquiringGps: string;
  refreshingGps: string;
  
  // Greetings
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  driverOnDuty: string;

  // Active Trip Card
  activeTrip: string;
  noActiveTrip: string;
  noActiveTripSubtitle: string;
  readyToStart: string;
  onRoute: string;
  returning: string;
  completed: string;
  startTrip: string;
  startingTrip: string;
  viewTripAndStops: string;
  nextStop: string;
  progress: string;
  from: string;
  to: string;

  // Quick Actions Grid
  quickActions: string;
  liveLocation: string;
  shareLocation: string;
  linkCopied: string;
  tripStops: string;
  vehiclePapers: string;
  callDispatch: string;
  reportDelay: string;
  addStop: string;
  emergencySos: string;

  // Stop Workflow Card
  stopWorkflow: string;
  navigateCustomer: string;
  callContact: string;
  arrivedAtStop: string;
  arriving: string;
  proofOfDelivery: string;
  takePhoto: string;
  retakePhoto: string;
  photoCaptured: string;
  notesOrSignature: string;
  completeStop: string;
  completing: string;
  allStopsCompleted: string;
  backToTripList: string;

  // Emergency Screen
  emergencyTitle: string;
  emergencySubtitle: string;
  call112: string;
  call112Sub: string;
  callDispatchSub: string;
  breakdownAssistance: string;
  breakdownSub: string;
  sosBroadcast: string;
  sosSent: string;

  // More Screen & Settings
  driverProfile: string;
  languageSelect: string;
  languageSelectSub: string;
  switchRole: string;
  logout: string;
  offlineQueueStatus: string;
  allSynced: string;
  pendingSync: string;
}

const TRANSLATIONS: Record<DriverLanguage, Translations> = {
  en: {
    home: 'Home',
    trip: 'Trip',
    map: 'Map',
    emergency: 'Emergency',
    more: 'More',
    vehicle: 'Vehicle',
    status: 'Status',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    gpsConnected: 'GPS Connected',
    acquiringGps: 'Acquiring GPS',
    refreshingGps: 'Refreshing GPS...',

    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    driverOnDuty: 'Driver on Duty',

    activeTrip: 'Active Trip',
    noActiveTrip: 'No Active Trip Assigned',
    noActiveTripSubtitle: 'You do not have an active dispatch order. Please stand by for fleet dispatch.',
    readyToStart: 'READY TO START',
    onRoute: 'ON ROUTE',
    returning: 'RETURNING',
    completed: 'COMPLETED',
    startTrip: 'Start Trip',
    startingTrip: 'Starting...',
    viewTripAndStops: 'View Trip & Stops',
    nextStop: 'Next Stop',
    progress: 'Progress',
    from: 'From',
    to: 'To',

    quickActions: 'Quick Actions',
    liveLocation: 'Live Location',
    shareLocation: 'Share Live Location',
    linkCopied: 'Link Copied to Clipboard',
    tripStops: 'Trip Stops',
    vehiclePapers: 'Vehicle Papers',
    callDispatch: 'Call Dispatch',
    reportDelay: 'Report Delay',
    addStop: 'Add Custom Stop',
    emergencySos: 'Emergency SOS',

    stopWorkflow: 'Stop Workflow',
    navigateCustomer: 'Navigate to Stop',
    callContact: 'Call Contact',
    arrivedAtStop: 'Mark Arrived at Stop',
    arriving: 'Marking Arrived...',
    proofOfDelivery: 'Proof of Delivery (POD)',
    takePhoto: 'Take Proof Photo',
    retakePhoto: 'Retake Photo',
    photoCaptured: 'Photo Captured',
    notesOrSignature: 'Delivery Notes / Remarks',
    completeStop: 'Complete Stop Delivery',
    completing: 'Completing Delivery...',
    allStopsCompleted: 'All Scheduled Stops Completed',
    backToTripList: 'Back to All Stops',

    emergencyTitle: 'SOS & Emergency Assistance',
    emergencySubtitle: 'Immediate safety response and fleet roadside assistance',
    call112: 'Call 112 (National Emergency)',
    call112Sub: 'Police, Ambulance, and Fire Helpline',
    callDispatchSub: 'Contact HoseXperts Operations Desk',
    breakdownAssistance: 'Roadside Breakdown Support',
    breakdownSub: 'Towing, flat tyre, or mechanical failure',
    sosBroadcast: 'Broadcast Emergency SOS to Operations',
    sosSent: 'SOS Alert Sent to Fleet Manager',

    driverProfile: 'Driver Profile',
    languageSelect: 'App Language',
    languageSelectSub: 'Choose your preferred language',
    switchRole: 'Switch to Manager View',
    logout: 'Log Out',
    offlineQueueStatus: 'Offline Sync Queue',
    allSynced: 'All events synchronized with cloud server',
    pendingSync: 'events waiting to sync when connected'
  },

  hi: {
    home: 'होम',
    trip: 'यात्रा (Trip)',
    map: 'मैप',
    emergency: 'आपातकालीन',
    more: 'अन्य (More)',
    vehicle: 'गाड़ी',
    status: 'स्थिति',
    back: 'वापस',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    loading: 'लोड हो रहा है...',
    gpsConnected: 'GPS कनेक्टेड',
    acquiringGps: 'GPS खोज रहे हैं',
    refreshingGps: 'GPS रिफ्रेश हो रहा है...',

    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    driverOnDuty: 'ड्यूटी पर चालक',

    activeTrip: 'सक्रिय यात्रा',
    noActiveTrip: 'कोई सक्रिय ट्रिप नहीं है',
    noActiveTripSubtitle: 'वर्तमान में आपको कोई यात्रा आवंटित नहीं है। कृपया डिस्पैच का इंतज़ार करें।',
    readyToStart: 'शुरू करने के लिए तैयार',
    onRoute: 'रास्ते में (ऑन रूट)',
    returning: 'वापसी पर',
    completed: 'यात्रा पूरी हुई',
    startTrip: 'यात्रा शुरू करें',
    startingTrip: 'शुरू हो रहा है...',
    viewTripAndStops: 'स्टॉप और विवरण देखें',
    nextStop: 'अगला स्टॉप',
    progress: 'प्रगति',
    from: 'कहाँ से',
    to: 'कहाँ तक',

    quickActions: 'त्वरित कार्य',
    liveLocation: 'लाइव लोकेशन शेयर',
    shareLocation: 'लाइव लोकेशन भेजें',
    linkCopied: 'लिंक कॉपी हो गया',
    tripStops: 'यात्रा के स्टॉप',
    vehiclePapers: 'गाड़ी के कागज़ात',
    callDispatch: 'डिस्पैच को कॉल करें',
    reportDelay: 'देरी की सूचना दें',
    addStop: 'नया स्टॉप जोड़ें',
    emergencySos: 'इमरजेंसी SOS',

    stopWorkflow: 'स्टॉप डिलीवरी प्रक्रिया',
    navigateCustomer: 'रास्ता देखें (नेविगेट)',
    callContact: 'ग्राहक को कॉल करें',
    arrivedAtStop: 'स्टॉप पर पहुंच गए',
    arriving: 'पहुंच दर्ज हो रही है...',
    proofOfDelivery: 'डिलीवरी प्रमाण (POD रसीद)',
    takePhoto: 'रसीद / माल की फोटो लें',
    retakePhoto: 'दोबारा फोटो लें',
    photoCaptured: 'फोटो ले ली गई है',
    notesOrSignature: 'डिलीवरी टिप्पणी या नोट',
    completeStop: 'स्टॉप डिलीवरी पूरी करें',
    completing: 'पूरा किया जा रहा है...',
    allStopsCompleted: 'सभी स्टॉप सफलतापूर्वक पूरे हो गए',
    backToTripList: 'सभी स्टॉप सूची पर वापस',

    emergencyTitle: 'SOS और आपातकालीन सहायता',
    emergencySubtitle: 'सुरक्षा सहायता और सड़क पर गाड़ी खराबी सपोर्ट',
    call112: '112 पर कॉल करें (पुलिस/एम्बुलेंस)',
    call112Sub: 'राष्ट्रीय आपातकालीन हेल्पलाइन',
    callDispatchSub: 'HoseXperts ऑपरेशन्स मैनेजर से बात करें',
    breakdownAssistance: 'गाड़ी खराबी / टोइंग सहायता',
    breakdownSub: 'पंचर, खराबी या ब्रेकडाउन के लिए',
    sosBroadcast: 'ऑपरेशन्स को तुरंत SOS अलर्ट भेजें',
    sosSent: 'SOS अलर्ट मैनेजर को भेज दिया गया है',

    driverProfile: 'ड्राइवर प्रोफ़ाइल',
    languageSelect: 'ऐप की भाषा (Language)',
    languageSelectSub: 'अपनी पसंदीदा भाषा चुनें',
    switchRole: 'मैनेजर व्यू पर जाएं',
    logout: 'लॉग आउट',
    offlineQueueStatus: 'ऑफ़लाइन सिंक स्थिति',
    allSynced: 'सभी डेटा सर्वर पर अपडेट है',
    pendingSync: 'अपडेट इंटरनेट आने पर ऑटोमैटिक सिंक होंगे'
  },

  hinglish: {
    home: 'Home',
    trip: 'Trip',
    map: 'Map',
    emergency: 'Emergency SOS',
    more: 'More Options',
    vehicle: 'Gaadi',
    status: 'Status',
    back: 'Peeche (Back)',
    cancel: 'Cancel Karein',
    confirm: 'Confirm Karein',
    loading: 'Load ho raha hai...',
    gpsConnected: 'GPS Connected Hai',
    acquiringGps: 'GPS Dhundh Raha Hai',
    refreshingGps: 'GPS Refresh Ho Raha Hai...',

    goodMorning: 'Good Morning (Shubh Prabhat)',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    driverOnDuty: 'Driver On Duty',

    activeTrip: 'Active Trip',
    noActiveTrip: 'Abhi Koi Trip Assign Nahi Hai',
    noActiveTripSubtitle: 'Aapko abhi koi dispatch order nahi mila hai. Please fleet dispatch ka wait karein.',
    readyToStart: 'START KARNE KE LIYE TAIYAR',
    onRoute: 'RASTE MEIN (ON ROUTE)',
    returning: 'WAPAS AA RAHE HAIN',
    completed: 'TRIP COMPLETE HO GAYI',
    startTrip: 'Trip Shuru Karein (Start)',
    startingTrip: 'Start ho raha hai...',
    viewTripAndStops: 'Stops Aur Details Dekhein',
    nextStop: 'Agla Stop',
    progress: 'Progress',
    from: 'Kahan Se',
    to: 'Kahan Tak',

    quickActions: 'Quick Actions (Zaroori Kaam)',
    liveLocation: 'Live Location Bhejo',
    shareLocation: 'Live Location WhatsApp Par Bhejo',
    linkCopied: 'Location Link Copy Ho Gaya',
    tripStops: 'Trip Ke Stops',
    vehiclePapers: 'Gaadi Ke Papers (RC / Ins)',
    callDispatch: 'Dispatch Manager Ko Call',
    reportDelay: 'Late Hone Ka Alert Bhejo',
    addStop: 'Naya Stop Add Karein',
    emergencySos: 'Emergency SOS Madad',

    stopWorkflow: 'Stop Delivery Workflow',
    navigateCustomer: 'Rasta Dekho (Google Maps)',
    callContact: 'Customer Ko Phone Karein',
    arrivedAtStop: 'Stop Par Pahunch Gaye (Arrived)',
    arriving: 'Arrival mark ho raha hai...',
    proofOfDelivery: 'Delivery Ka Proof (POD / Receipt)',
    takePhoto: 'Receipt / Bilty Ki Photo Kheecho',
    retakePhoto: 'Wapas Photo Kheecho',
    photoCaptured: 'Photo Save Ho Gayi Hai',
    notesOrSignature: 'Delivery Remarks / Receiver Ka Naam',
    completeStop: 'Stop Delivery Complete Karein',
    completing: 'Delivery complete ho rahi hai...',
    allStopsCompleted: 'Saare Stops Complete Ho Gaye!',
    backToTripList: 'Saare Stops Ki List Dekhein',

    emergencyTitle: 'SOS Emergency & Madad',
    emergencySubtitle: 'Suraksha aur raste me gaadi breakdown helpline',
    call112: '112 Par Call Karein (Police / Ambulance)',
    call112Sub: 'Emergency Government Helpline',
    callDispatchSub: 'HoseXperts Dispatch Room Ko Phone Lagayein',
    breakdownAssistance: 'Gaadi Kharab / Breakdown Support',
    breakdownSub: 'Puncture, engine kharabi ya towing ke liye',
    sosBroadcast: 'Manager Ko Turant SOS Alert Bhejo',
    sosSent: 'SOS Alert Dispatch Desk Ko Bhej Diya Gaya Hai',

    driverProfile: 'Driver Profile',
    languageSelect: 'App Ki Bhasha (Language)',
    languageSelectSub: 'Apni pasand ki bhasha chunein',
    switchRole: 'Manager View Par Jayein',
    logout: 'Log Out Karein',
    offlineQueueStatus: 'Offline Save Queue',
    allSynced: 'Sabhi updates cloud server par synced hain',
    pendingSync: 'updates internet aane par automatically upload honge'
  }
};

interface DriverLanguageContextValue {
  language: DriverLanguage;
  setLanguage: (lang: DriverLanguage) => void;
  t: Translations;
}

const DriverLanguageContext = createContext<DriverLanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: TRANSLATIONS.en
});

const STORAGE_KEY = 'truck_tracker_driver_language_v1';

export const DriverLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<DriverLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'hinglish' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  const setLanguage = (newLang: DriverLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
  };

  const value: DriverLanguageContextValue = {
    language,
    setLanguage,
    t: TRANSLATIONS[language] || TRANSLATIONS.en
  };

  return (
    <DriverLanguageContext.Provider value={value}>
      {children}
    </DriverLanguageContext.Provider>
  );
};

export const useDriverTranslation = () => {
  return useContext(DriverLanguageContext);
};

export const useDriverLanguage = useDriverTranslation;
