// styles/globalStyles.ts
import { StyleSheet, Platform } from 'react-native';

export const DRAWER_WIDTH = 280;

export const globalStyles = StyleSheet.create({
  // Drawer
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    zIndex: 1100,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  drawerContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
  },
  drawerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  drawerItemText: {
    fontSize: 16,
    marginLeft: 16,
  },
  drawerIconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main
  mainContent: {
    flex: 1,
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1050,
  },

  // AppBar
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    height: Platform.OS === 'ios' ? 88 : 56,
    marginTop: 30,
  },
  iconButton: {
    padding: 8,
  },
  roundedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appbarTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  appbarTitleBold: {
    fontWeight: '900',
  },
  backButton: {
    padding: 8,
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 80 : 65,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  createMenu: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    width: '100%',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },

  // Platform Modal
  platformModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  platformModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  platformModalContent: {
    height: '95%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    zIndex: 1300,
  },
  webView: {
    flex: 1,
  },

  // Settings
  settingsContainer: {
    flex: 1,
  },
  settingsContent: {
    flex: 1,
    padding: 16,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#1877F2',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
});