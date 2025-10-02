import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, useColorScheme, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { useFundraiser } from '@/contexts/FundraiserContext';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Fundraiser } from '@/types/fundraiser';
import { Heart, Phone, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react-native';
import { QUICK_AMOUNTS, WORKER_URL } from '@/constants/fundraisers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function DonateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { createDonation, updateDonationStatus, config } = useFundraiser();
  const webViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentDonationId, setCurrentDonationId] = useState('');

  const fundraiserQuery = useQuery({
    queryKey: ['fundraiser', id],
    queryFn: async (): Promise<Fundraiser> => {
      const docRef = doc(db, 'fundraisers', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Fundraiser not found');
      }
      return { id: docSnap.id, ...docSnap.data() } as Fundraiser;
    },
  });

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
  };

  const handleDonate = async () => {
    const amountNum = parseFloat(amount);

    if (!amount || amountNum <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (config && amountNum < config.minDonation) {
      Alert.alert('Erreur', `Le montant minimum est de ${config.minDonation} ${config.currency}`);
      return;
    }

    if (config && amountNum > config.maxDonation) {
      Alert.alert('Erreur', `Le montant maximum est de ${config.maxDonation} ${config.currency}`);
      return;
    }

    if (!donorPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    setLoading(true);
    try {
      const donation = await createDonation({
        fundraiserId: id,
        amount: amountNum,
        donorName: donorName.trim() || 'Anonyme',
        donorPhone: donorPhone.trim(),
        message: message.trim(),
        isPublic,
      });

      setCurrentDonationId(donation.id);
      const url = `${WORKER_URL}/payment-page?depositId=${donation.depositId}&amount=${amountNum * 100}&currency=${config?.currency || 'CDF'}`;
      setPaymentUrl(url);
      setShowPayment(true);
    } catch (error) {
      console.error('Error creating donation:', error);
      Alert.alert('Erreur', 'Impossible de créer le don');
    } finally {
      setLoading(false);
    }
  };

  const handleNavChange = async (navState: any) => {
    const url = navState.url;
    console.log('Navigation URL:', url);

    if (url.includes('status=SUCCESS')) {
      await updateDonationStatus({
        donationId: currentDonationId,
        status: 'success',
      });

      Alert.alert(
        'Merci',
        'Votre don a été effectué avec succès',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPayment(false);
              router.back();
            },
          },
        ]
      );
    } else if (url.includes('status=FAILED')) {
      await updateDonationStatus({
        donationId: currentDonationId,
        status: 'failed',
      });

      Alert.alert('Erreur', 'Le paiement a échoué', [
        {
          text: 'Réessayer',
          onPress: () => setShowPayment(false),
        },
      ]);
    }
  };

  if (showPayment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Paiement',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={() => setShowPayment(false)}>
                <Text style={[styles.cancelButton, { color: colors.tint }]}>Annuler</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavChange}
          style={styles.webview}
        />
      </View>
    );
  }

  if (fundraiserQuery.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const fundraiser = fundraiserQuery.data;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Faire un don',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.cancelButton, { color: colors.tint }]}>Annuler</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.fundraiserInfo, { backgroundColor: colors.card }]}>
          <LinearGradient
            colors={[colors.gradient1 + '20', colors.gradient2 + '20']}
            style={styles.heartIcon}
          >
            <Heart size={32} color={colors.accent} strokeWidth={2} />
          </LinearGradient>
          <Text style={[styles.fundraiserTitle, { color: colors.text }]} numberOfLines={2}>
            {fundraiser?.title}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Montant ({config?.currency || 'CDF'})</Text>
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountButton,
                  { 
                    borderColor: amount === value.toString() ? colors.tint : colors.border,
                    backgroundColor: amount === value.toString() 
                      ? colors.tint 
                      : colors.backgroundSecondary
                  }
                ]}
                onPress={() => handleAmountSelect(value)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    { color: amount === value.toString() ? '#FFFFFF' : colors.text }
                  ]}
                >
                  {value.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border, 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text 
            }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Montant personnalisé"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Votre nom (optionnel)</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border, 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text 
            }]}
            value={donorName}
            onChangeText={setDonorName}
            placeholder="Anonyme"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Phone size={18} color={colors.tint} />
            <Text style={[styles.label, { color: colors.text }]}>Numéro de téléphone</Text>
          </View>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border, 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text 
            }]}
            value={donorPhone}
            onChangeText={setDonorPhone}
            placeholder="+243 XXX XXX XXX"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
          />
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Pour M-Pesa, Airtel Money ou Orange Money
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <MessageSquare size={18} color={colors.tint} />
            <Text style={[styles.label, { color: colors.text }]}>Message (optionnel)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, { 
              borderColor: colors.border, 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text 
            }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Laissez un message de soutien..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={styles.publicToggle}
          onPress={() => setIsPublic(!isPublic)}
        >
          <View style={[styles.checkbox, { borderColor: colors.border }, isPublic && { backgroundColor: colors.tint, borderColor: colors.tint }]}>
            {isPublic && <CheckCircle2 size={22} color="#FFFFFF" strokeWidth={2.5} />}
          </View>
          <Text style={[styles.publicToggleText, { color: colors.text }]}>
            Afficher mon don publiquement
          </Text>
        </TouchableOpacity>

        {config && (
          <View style={[styles.feeInfo, { 
            backgroundColor: colors.warning + '20',
            borderColor: colors.warning + '40'
          }]}>
            <Sparkles size={18} color={colors.warning} />
            <View style={styles.feeTextContainer}>
              <Text style={[styles.feeText, { color: colors.warning }]}>
                Frais de plateforme: {config.platformFeePercent}%
              </Text>
              <Text style={[styles.feeSubtext, { color: colors.warning }]}>
                Le créateur recevra {100 - config.platformFeePercent}% de votre don
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.donateButton, loading && styles.donateButtonDisabled]}
          onPress={handleDonate}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.gradient1, colors.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.donateButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Heart size={22} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
                <Text style={styles.donateButtonText}>
                  Donner {amount ? `${parseFloat(amount).toLocaleString()} ${config?.currency || 'CDF'}` : ''}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  fundraiserInfo: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    marginBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heartIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  fundraiserTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  quickAmountButton: {
    paddingHorizontal: 26,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  quickAmountText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  input: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    fontWeight: '500' as const,
  },
  textArea: {
    height: 120,
    paddingTop: 18,
  },
  hint: {
    fontSize: 14,
    marginTop: 10,
    fontWeight: '600' as const,
  },
  publicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicToggleText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  feeInfo: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    gap: 14,
    alignItems: 'flex-start',
  },
  feeTextContainer: {
    flex: 1,
  },
  feeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  feeSubtext: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  donateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  donateButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  donateButtonDisabled: {
    opacity: 0.6,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  webview: {
    flex: 1,
  },
});
