// screens/SettingsScreen.tsx  
import React, { useState, useRef } from 'react';  
import {  
  View,  
  Text,  
  TouchableOpacity,  
  ScrollView,  
  Modal,  
  Animated,  
  StyleSheet,  
  StatusBar as RNStatusBar,  
  Image,  
  Platform,
  Dimensions,
} from 'react-native';  
import { MaterialCommunityIcons } from '@expo/vector-icons';  
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, getDynamicColors } from '../styles/theme';  
import { getTranslation } from '../utils/translations';  
import { 
  AutoThemeIcon, 
  LightThemeIcon, 
  DarkThemeIcon, 
  ThemeSectionIcon,
  BackArrowIcon,
  ContrastIcon,
  LanguageIcon,
} from '../components/Icons';  

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
  
// Limit languages to only Portuguese and English as per user requirement  
const LANGUAGE_FLAGS = {  
  pt: 'https://flagcdn.com/w320/pt.png',  
  en: 'https://flagcdn.com/w320/gb.png',  
};  
  
const LANGUAGES = [  
  { code: 'pt', name: 'Português', nativeName: 'Português' },  
  { code: 'en', name: 'English', nativeName: 'English' },  
];  
  
// Theme options with custom components and colors  
const THEME_OPTIONS = [  
  { value: 'light', label: 'lightMode', component: LightThemeIcon, iconColor: '#FFD700' },  
  { value: 'dark', label: 'darkMode', component: DarkThemeIcon, iconColor: '#4169E1' },  
  { value: 'auto', label: 'autoMode', component: AutoThemeIcon, iconColor: null },  
];  
  
export default function SettingsScreen({  
  navigation,  
  isDarkMode,  
  setIsDarkMode,  
  language,  
  setLanguage,  
}) {  
  const [showThemeModal, setShowThemeModal] = useState(false);  
  const [showLanguageModal, setShowLanguageModal] = useState(false);  
  const [themeMode, setThemeMode] = useState(isDarkMode ? 'dark' : 'light');  
  const [modalActive, setModalActive] = useState(false);  
  
  const insets = useSafeAreaInsets();
  const themeModalAnimation = useRef(new Animated.Value(0)).current;  
  const languageModalAnimation = useRef(new Animated.Value(0)).current;  
  const screenPushAnimation = useRef(new Animated.Value(0)).current;
  
  const colors = isDarkMode ? COLORS.dark : COLORS.light;  
  const appColors = getDynamicColors(isDarkMode);  
  
  const openThemeModal = () => {
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowThemeModal(true);
    Animated.parallel([
      Animated.spring(themeModalAnimation, {  
        toValue: 1,  
        tension: 50,  
        friction: 9,  
        useNativeDriver: true,  
      }),
      Animated.timing(screenPushAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();  
  };  
  
  const closeThemeModal = () => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.timing(themeModalAnimation, {  
        toValue: 0,  
        duration: 250,  
        useNativeDriver: true,  
      }),
      Animated.timing(screenPushAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {  
      setShowThemeModal(false);
    });  
  };  
  
  const openLanguageModal = () => {
    setModalActive(true);
    RNStatusBar.setBarStyle('light-content', true);
    setShowLanguageModal(true);
    Animated.parallel([
      Animated.spring(languageModalAnimation, {  
        toValue: 1,  
        tension: 50,  
        friction: 9,  
        useNativeDriver: true,  
      }),
      Animated.timing(screenPushAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();  
  };  
  
  const closeLanguageModal = () => {
    setModalActive(false);
    RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
    Animated.parallel([
      Animated.timing(languageModalAnimation, {  
        toValue: 0,  
        duration: 250,  
        useNativeDriver: true,  
      }),
      Animated.timing(screenPushAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {  
      setShowLanguageModal(false);
    });  
  };  
  
  const handleThemeChange = (mode: string) => {  
    setThemeMode(mode);  
    if (mode === 'light') {  
      setIsDarkMode(false);  
    } else if (mode === 'dark') {  
      setIsDarkMode(true);  
    }  
    closeThemeModal();  
  };  
  
  const handleLanguageChange = (langCode: string) => {  
    setLanguage(langCode);  
    closeLanguageModal();  
  };  
  
  const getThemeLabel = () => {  
    const option = THEME_OPTIONS.find(opt => opt.value === themeMode);  
    return option ? getTranslation(language, option.label) : '';  
  };  
  
  const getLanguageLabel = () => {  
    const lang = LANGUAGES.find(l => l.code === language);  
    return lang ? lang.nativeName : '';  
  };  
  
  const currentThemeOption = THEME_OPTIONS.find(opt => opt.value === themeMode) || THEME_OPTIONS[2];  

  const screenScale = screenPushAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });

  const screenTranslateY = screenPushAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const screenBorderRadius = screenPushAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });
  
  return (  
    <View style={styles.wrapper}>
      <RNStatusBar  
        barStyle={modalActive ? 'light-content' : (isDarkMode ? 'light-content' : 'dark-content')}
        backgroundColor={modalActive ? '#000' : 'transparent'}
        translucent={true}  
        animated={true}  
      />

      <Animated.View 
        style={[
          styles.screenContainer,
          {
            backgroundColor: colors.background,
            transform: [
              { scale: screenScale },
              { translateY: screenTranslateY },
            ],
            borderTopLeftRadius: screenBorderRadius,
            borderTopRightRadius: screenBorderRadius,
            overflow: 'hidden',
          }
        ]}
      >
        <View style={[styles.appbar, { backgroundColor: colors.background, paddingTop: insets.top }]}>  
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>  
            <BackArrowIcon size={20} color={colors.text} />
          </TouchableOpacity>  
          <Text style={[styles.appbarTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">  
            {getTranslation(language, 'settings')}  
          </Text>  
        </View>  
    
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>  
          <View style={styles.section}>  
            <View style={styles.sectionHeader}>
              <ThemeSectionIcon size={18} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>  
                Aparência  
              </Text>  
            </View>
    
            <TouchableOpacity  
              style={[styles.settingButton, { backgroundColor: colors.surface }]}  
              onPress={openThemeModal}  
              activeOpacity={0.7}  
            >  
              <View style={styles.settingLeft}>  
                <View style={styles.iconContainer}>
                  <currentThemeOption.component   
                    size={22}   
                    color={currentThemeOption.iconColor || colors.text}   
                  />  
                </View>
                <View style={styles.settingTextContainer}>  
                  <Text style={[styles.settingTitle, { color: colors.text }]}>  
                    {getTranslation(language, 'theme')}  
                  </Text>  
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>  
                    {getThemeLabel()}  
                  </Text>  
                </View>  
              </View>  
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />  
            </TouchableOpacity>  
          </View>  
    
          <View style={styles.section}>  
            <View style={styles.sectionHeader}>
              <LanguageIcon size={18} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>  
                {getTranslation(language, 'languageLabel')}  
              </Text>  
            </View>
    
            <TouchableOpacity  
              style={[styles.settingButton, { backgroundColor: colors.surface }]}  
              onPress={openLanguageModal}  
              activeOpacity={0.7}  
            >  
              <View style={styles.settingLeft}>  
                <View style={styles.iconContainer}>
                  <Image  
                    source={{ uri: LANGUAGE_FLAGS[language] }}  
                    style={styles.flagIcon}  
                    resizeMode="cover"  
                  />  
                </View>
                <View style={styles.settingTextContainer}>  
                  <Text style={[styles.settingTitle, { color: colors.text}]}>  
                    Idioma  
                  </Text>  
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>  
                    {getLanguageLabel()}  
                  </Text>  
                </View>  
              </View>  
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />  
            </TouchableOpacity>  
          </View>  
        </ScrollView>
      </Animated.View>
    
      <Modal  
        visible={showThemeModal}  
        transparent  
        animationType="none"  
        onRequestClose={closeThemeModal}  
      >  
        <TouchableOpacity  
          style={styles.modalOverlay}  
          activeOpacity={1}  
          onPress={closeThemeModal}  
        >  
          <Animated.View  
            style={[  
              styles.modalContent,  
              { backgroundColor: colors.surface },  
              {  
                transform: [  
                  {  
                    translateY: themeModalAnimation.interpolate({  
                      inputRange: [0, 1],  
                      outputRange: [300, 0],  
                    }),  
                  },  
                ],  
                opacity: themeModalAnimation,  
              },  
            ]}  
          >  
            <View style={styles.modalHeader}>  
              <Text style={[styles.modalTitle, { color: colors.text }]}>  
                {getTranslation(language, 'theme')}  
              </Text>  
            </View>  
    
            <View style={styles.modalOptions}>  
              {THEME_OPTIONS.map((option) => (  
                <TouchableOpacity  
                  key={option.value}  
                  style={[  
                    styles.modalOption,  
                    themeMode === option.value && {  
                      backgroundColor: isDarkMode ? '#2D2D30' : '#F0F0F5',  
                    },  
                  ]}  
                  onPress={() => handleThemeChange(option.value)}  
                  activeOpacity={0.7}  
                >  
                  <View style={styles.modalIconContainer}>
                    <option.component   
                      size={24}   
                      color={option.iconColor || (themeMode === option.value ? appColors.primary : colors.text)}   
                    />  
                  </View>
                  <Text  
                    style={[  
                      styles.modalOptionText,  
                      {  
                        color: themeMode === option.value ? appColors.primary : colors.text,  
                      },  
                    ]}  
                  >  
                    {getTranslation(language, option.label)}  
                  </Text>  
                  {themeMode === option.value && (  
                    <MaterialCommunityIcons name="check" size={24} color={appColors.primary} />  
                  )}  
                </TouchableOpacity>  
              ))}  
            </View>  
          </Animated.View>  
        </TouchableOpacity>  
      </Modal>  
    
      <Modal  
        visible={showLanguageModal}  
        transparent  
        animationType="none"  
        onRequestClose={closeLanguageModal}  
      >  
        <TouchableOpacity  
          style={styles.modalOverlay}  
          activeOpacity={1}  
          onPress={closeLanguageModal}  
        >  
          <Animated.View  
            style={[  
              styles.modalContent,  
              { backgroundColor: colors.surface },  
              {  
                transform: [  
                  {  
                    translateY: languageModalAnimation.interpolate({  
                      inputRange: [0, 1],  
                      outputRange: [300, 0],  
                    }),  
                  },  
                ],  
                opacity: languageModalAnimation,  
              },  
            ]}  
          >  
            <View style={styles.modalHeader}>  
              <Text style={[styles.modalTitle, { color: colors.text }]}>  
                Selecionar Idioma  
              </Text>  
            </View>  
    
            <ScrollView style={styles.modalOptions} showsVerticalScrollIndicator={false}>  
              {LANGUAGES.map((lang) => (  
                <TouchableOpacity  
                  key={lang.code}  
                  style={[  
                    styles.modalOption,  
                    language === lang.code && {  
                      backgroundColor: isDarkMode ? '#2D2D30' : '#F0F0F5',  
                    },  
                  ]}  
                  onPress={() => handleLanguageChange(lang.code)}  
                  activeOpacity={0.7}  
                >  
                  <View style={styles.modalIconContainer}>
                    <Image  
                      source={{ uri: LANGUAGE_FLAGS[lang.code] }}  
                      style={styles.flagImage}  
                      resizeMode="cover"  
                    />  
                  </View>
                  <Text  
                    style={[  
                      styles.modalOptionText,  
                      {  
                        color: language === lang.code ? appColors.primary : colors.text,  
                      },  
                    ]}  
                  >  
                    {lang.nativeName}  
                  </Text>  
                  {language === lang.code && (  
                    <MaterialCommunityIcons name="check" size={24} color={appColors.primary} />  
                  )}  
                </TouchableOpacity>  
              ))}  
            </ScrollView>  
          </Animated.View>  
        </TouchableOpacity>  
      </Modal>  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  screenContainer: {
    flex: 1,
  },
  appbar: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingHorizontal: 4,
    paddingBottom: 12,  
  },  
  backButton: {  
    padding: 8,  
    marginRight: 4,  
  },  
  appbarTitle: {  
    fontSize: 20,  
    fontWeight: '600',  
    letterSpacing: 0.15,  
    flex: 1,  
  },  
  content: {  
    flex: 1,  
    paddingTop: 8,  
  },  
  section: {  
    marginBottom: 24,  
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {  
    fontSize: 13,  
    fontWeight: '600',  
    textTransform: 'uppercase',  
    letterSpacing: 0.5,  
  },  
  settingButton: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    justifyContent: 'space-between',  
    paddingHorizontal: 16,  
    paddingVertical: 16,  
    marginHorizontal: 16,  
    borderRadius: 12,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 3.84,  
    elevation: 2,  
  },  
  settingLeft: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    flex: 1,  
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flagIcon: {  
    width: 24,  
    height: 18,  
    borderRadius: 2,  
  },  
  settingTextContainer: {  
    flex: 1,  
  },  
  settingTitle: {  
    fontSize: 16,  
    fontWeight: '500',  
    marginBottom: 2,  
  },  
  settingSubtitle: {  
    fontSize: 13,  
  },  
  modalOverlay: {  
    flex: 1,  
    backgroundColor: 'rgba(0, 0, 0, 0.3)',  
    justifyContent: 'flex-end',  
  },  
  modalContent: {  
    borderTopLeftRadius: 10,  
    borderTopRightRadius: 10,  
    paddingBottom: 24,  
    maxHeight: '70%',  
  },  
  modalHeader: {  
    paddingHorizontal: 20,  
    paddingTop: 20,  
    paddingBottom: 16,  
    borderBottomWidth: 0,  
  },  
  modalTitle: {  
    fontSize: 20,  
    fontWeight: '600',  
  },  
  modalOptions: {  
    paddingHorizontal: 12,  
  },  
  modalOption: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingHorizontal: 16,  
    paddingVertical: 14,  
    borderRadius: 12,  
    marginBottom: 6,  
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionText: {  
    fontSize: 16,  
    fontWeight: '500',  
    flex: 1,  
  },  
  flagImage: {  
    width: 32,  
    height: 24,  
    borderRadius: 4,  
  },  
});