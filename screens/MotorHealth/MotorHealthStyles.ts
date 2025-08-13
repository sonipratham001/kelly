import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  socRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 15,
    alignItems: 'center',
    marginTop: 18,
  },
  svgContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svgText: {
    position: 'absolute',
    color: '#f472b6',
    fontSize: 22,
    fontWeight: 'bold',
  },
  socRight: {
    paddingLeft: 20,
  },
  socText: {
    color: '#f472b6',
    fontSize: 30,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 10,
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 20
  },
  metricText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 6,
  },
  metricValue: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    marginTop: 4,
  },
  faultContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 14,
    marginTop: 0,
    marginBottom: 20,
    width: '90%',
  },
  faultText: {
    fontSize: 13,
    color: '#f87171',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default styles;