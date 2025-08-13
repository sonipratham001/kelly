import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  socRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 30,
    alignItems: 'center',
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
    color: '#00ff88',
    fontSize: 22,
    fontWeight: 'bold',
  },
  socRight: {
    paddingLeft: 20,
  },
  socText: {
    color: '#00ff88',
    fontSize: 36,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 30,
  },
  metricBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    width: width * 0.42,
    alignItems: 'center',
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 20,
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
});

export default styles;