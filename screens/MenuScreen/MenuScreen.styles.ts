import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 40,
    paddingTop: 40,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  iconBox: {
    width: width / 4.5,
    height: height / 3.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default styles;