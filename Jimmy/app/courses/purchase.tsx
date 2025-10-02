import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CreditCard, Phone, User } from 'lucide-react-native';
import { useCourse } from '@/contexts/CourseContext';
import { WORKER_URL } from '@/constants/course';
import WebView from 'react-native-webview';
import * as Crypto from 'expo-crypto';

export default function PurchaseScreen() {
  const { courseId, courseName, price, creatorId } = useLocalSearchParams<{
    courseId: string;
    courseName: string;
    price: string;
    creatorId: string;
  }>();
  const router = useRouter();
  const { createPurchase, updatePurchaseStatus, currentUserName } = useCourse();
  const [name, setName] = useState<string>(currentUserName);
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [purchaseId, setPurchaseId] = useState<string>('');
  const webViewRef = useRef<WebView>(null);

  const handlePurchase = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!courseId || !courseName || !price || !creatorId) {
      Alert.alert('Erreur', 'Données de cours invalides');
      return;
    }

    setLoading(true);
    try {
      const depositId = Crypto.randomUUID();
      console.log('[PawaPay] UUID généré:', depositId);

      const purchase = await createPurchase({
        courseId,
        courseName,
        amount: parseFloat(price),
        buyerName: name.trim(),
        buyerPhone: phone.trim(),
        depositId,
      });

      setPurchaseId(purchase.id);
      const url = `${WORKER_URL}/payment-page?depositId=${depositId}&amount=${parseFloat(price)}&currency=CDF`;
      setPaymentUrl(url);
      setShowPayment(true);
    } catch (error) {
      console.error('Error creating purchase:', error);
      Alert.alert('Erreur', 'Impossible d\'initier l\'achat');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    console.log('[PawaPay] Navigation state:', navState.url);
    
    if (navState.url.includes(`${WORKER_URL}/payment-return`)) {
      const params = new URL(navState.url).searchParams;
      const returnedId = params.get('depositId');
      console.log('[PawaPay] depositId reçu:', returnedId);
      
      if (returnedId) {
        setShowPayment(false);
        pollPaymentStatus(returnedId);
      }
    }
  };

  const pollPaymentStatus = (depositId: string) => {
    console.log('[PawaPay] Polling démarré pour', depositId);
    let tries = 0;
    const max = 20;
    const pollInterval = setInterval(async () => {
      tries++;
      try {
        const response = await fetch(`${WORKER_URL}/deposit-status?depositId=${depositId}`);
        if (!response.ok) throw new Error('Network error');
        const { status } = await response.json();
        const statusUpper = String(status).toUpperCase();
        console.log(`[PawaPay] Tentative ${tries} -> status: ${statusUpper}`);

        if (['SUCCESS', 'SUCCESSFUL'].includes(statusUpper)) {
          clearInterval(pollInterval);
          await updatePurchaseStatus({
            purchaseId,
            status: 'success',
            courseId,
            creatorId,
            amount: parseFloat(price),
          });
          Alert.alert('✅ Paiement confirmé', 'Achat effectué avec succès!', [
            { text: 'Regarder', onPress: () => router.replace('/my') },
          ]);
          return;
        }
        
        if (['FAILED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'ERROR'].includes(statusUpper)) {
          clearInterval(pollInterval);
          Alert.alert('Paiement échoué', 'Le paiement a été refusé ou annulé.');
          return;
        }
      } catch (error) {
        console.warn('[PawaPay] Erreur polling:', error);
      }

      if (tries >= max) {
        clearInterval(pollInterval);
        Alert.alert('⏱ Délai dépassé', 'Le paiement n\'a pas pu être confirmé.');
      }
    }, 3000);
  };

  if (showPayment) {
    return (
      <Modal visible={showPayment} animationType="slide" onRequestClose={() => setShowPayment(false)}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowPayment(false)}>
            <Text style={styles.closeButtonText}>✕ Fermer</Text>
          </TouchableOpacity>
          <WebView
            ref={webViewRef}
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            )}
          />
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <CreditCard size={48} color="#fff" />
          <Text style={styles.title}>Finaliser l'achat</Text>
          <Text style={styles.subtitle}>{courseName}</Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Montant Total</Text>
          <Text style={styles.priceValue}>{parseFloat(price).toLocaleString()} CDF</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              placeholderTextColor="#888"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.note}>
            Vous serez redirigé pour finaliser le paiement via mobile money (M-Pesa, Airtel, Orange)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.buttonText}>Procéder au paiement</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  priceLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#fff',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  note: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
  webview: {
    flex: 1,
  },
  closeButton: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 16,
  },
});
