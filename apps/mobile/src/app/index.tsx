import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { fetchHealth } from '../lib/api';

export default function Index() {
  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delifill</Text>
      <Text style={styles.subtitle}>Connection check</Text>

      <View style={styles.row}>
        {isLoading ? (
          <ActivityIndicator />
        ) : error ? (
          <CircleAlert color="#B42318" size={20} />
        ) : (
          <CircleCheck color="#067647" size={20} />
        )}
        <Text style={styles.status}>
          {isLoading
            ? 'Contacting server'
            : error
              ? `Cannot reach server: ${(error as Error).message}`
              : `Server ${data?.status}, database ${data?.database}`}
        </Text>
      </View>

      <Pressable style={styles.button} onPress={() => refetch()} disabled={isFetching}>
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: '600', color: '#1F2933' },
  subtitle: { fontSize: 14, color: '#52606D', marginTop: 4, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  status: { fontSize: 15, color: '#1F2933', flexShrink: 1 },
  button: {
    marginTop: 24,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#1F2933',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
});