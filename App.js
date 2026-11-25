import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { auth, db } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const CATS = ["Fashion A2Z","Electronics","Mobile / Phone","Home & Kitchen","Beauty","Grocery","Hardware / Tools","Electric Samaan","Bike Battery","Scooty Parts","Toys","Sports","Books","Other"];

export default function App() {
  const [step, setStep] = useState('login');
  const [name, setName] = useState('');
  const [shop, setShop] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [user, setUser] = useState(null);

  const [pname, setPname] = useState('');
  const [pprice, setPprice] = useState('');
  const [pdesc, setPdesc] = useState('');
  const [pstock, setPstock] = useState('');
  const [selCat, setSelCat] = useState('Fashion A2Z');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('supplierId', '==', user.uid));
    const unsub = onSnapshot(q, (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [user]);

  const sendOtp = async () => {
    if (name === '' || shop === '' || phone.length !== 10) return Alert.alert('Pura bharo', 'Naam, Shop Naam, 10 digit Mobile chahiye');
    try {
      // TESTING KE LIYE: Firebase Console me Test Number + 123456 rakho to bina SMS ke chalega
      // REAL OTP: Launch pe Firebase Phone Auth se asli SMS ayega
      const recaptcha = new RecaptchaVerifier(auth, 'recaptcha', { size: 'invisible' });
      const c = await signInWithPhoneNumber(auth, '+91' + phone, recaptcha);
      setConfirm(c);
      Alert.alert('OTP Gaya', 'Testing me 123456 dalo');
    } catch (e) { Alert.alert('OTP Fail', e.message + ' - Firebase me Test Number check karo'); }
  };

  const verifyOtp = async () => {
    try {
      const res = await confirm.confirm(otp);
      setUser(res.user);
      await setDoc(doc(db, 'suppliers', res.user.uid), { name, shop, phone, monthly: 199, commission: 0, time: serverTimestamp() });
      setStep('home');
    } catch (e) { Alert.alert('Galat OTP', e.message); }
  };

  const addProduct = async () => {
    if (pname === '' || pprice === '') return Alert.alert('Product Naam + Price chahiye');
    await addDoc(collection(db, 'products'), { name: pname, price: Number(pprice), category: selCat, desc: pdesc, stock: pstock || 'Unlimited', supplierId: user.uid, status: 'pending', time: serverTimestamp() });
    setPname(''); setPprice(''); setPdesc(''); setPstock('');
    Alert.alert('Ho Gaya', 'Product Admin ke paas gaya, Approve ke baad Customer ko dikhega');
  };

  if (step === 'login') {
    return (
      <ScrollView style={s.box}>
        <Text style={s.title}>Budget Dost SR - Supplier</Text>
        <Text style={s.sub}>Monthly ₹199 | Commission 0% | Delivery 40+50=90</Text>
        <TextInput style={s.inp} placeholder="Supplier ka Naam" value={name} onChangeText={setName} />
        <TextInput style={s.inp} placeholder="Shop ka Naam" value={shop} onChangeText={setShop} />
        <TextInput style={s.inp} placeholder="Mobile 10 digit" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        {!confirm ? <TouchableOpacity style={s.btn} onPress={sendOtp}><Text style={s.btnT}>OTP Bhejo</Text></TouchableOpacity> :
        <><TextInput style={s.inp} placeholder="OTP - Testing me 123456" keyboardType="number-pad" value={otp} onChangeText={setOtp} /><TouchableOpacity style={s.btn} onPress={verifyOtp}><Text style={s.btnT}>OTP Verify Karo</Text></TouchableOpacity></>}
        <View id="recaptcha" />
        <Text style={s.small}>Testing: Firebase me Test Number rakho. Real OTP Launch pe ON hoga.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.box}>
      <Text style={s.title}>Supplier Home - {shop}</Text>
      <Text style={s.sub}>Photo + Price daalo, Unlimited Product, Har Category</Text>
      <TextInput style={s.inp} placeholder="Product Naam *" value={pname} onChangeText={setPname} />
      <TextInput style={s.inp} placeholder="Price * - jaise 499" keyboardType="numeric" value={pprice} onChangeText={setPprice} />
      <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Category Chunno:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {CATS.map(c => <TouchableOpacity key={c} onPress={() => setSelCat(c)} style={[s.cat, selCat === c && s.catSel]}><Text style={{ color: selCat === c ? '#fff' : '#000', fontSize: 12 }}>{c}</Text></TouchableOpacity>)}
      </View>
      <TextInput style={s.inp} placeholder="Size / Color / Brand / Weight / Description" value={pdesc} onChangeText={setPdesc} />
      <TextInput style={s.inp} placeholder="Stock - Khali chhodo to Unlimited" value={pstock} onChangeText={setPstock} />
      <TouchableOpacity style={s.btn} onPress={addProduct}><Text style={s.btnT}>Product Add Karo</Text></TouchableOpacity>

      <Text style={[s.title, { marginTop: 20 }]}>Mere Orders</Text>
      {orders.length === 0 ? <Text>Abhi koi Order nahi</Text> : orders.map(o => {
        const sticker = o.stickerGenerated || false;
        return (
          <View key={o.id} style={s.card}>
            <Text style={{ fontWeight: 'bold' }}>Order ₹{o.total} - {o.paymentType} - {o.status}</Text>
            <Text>Customer Address: {o.address}</Text>
            {o.paymentType === 'cod' ? <Text style={{ color: 'red', fontSize: 11 }}>COD: Courier apna 40+50 rakh ke baaki dega, Tujhe 7 din baad milega</Text> : null}
            <TouchableOpacity style={s.smallBtn} onPress={async () => { await updateDoc(doc(db, 'orders', o.id), { stickerGenerated: true }); Alert.alert('Sticker Ban Gaya', 'Ab Courier button dabega - Customer ko Supplier ka Address/Number NAHI dikhega, sirf Budget Dost ka dikhega'); }}><Text style={s.btnT}>{sticker ? 'Sticker Done ✓' : 'Sticker Banao'}</Text></TouchableOpacity>
            <TouchableOpacity disabled={!sticker} style={[s.smallBtn, { backgroundColor: sticker ? 'green' : 'grey' }]} onPress={async () => { await addDoc(collection(db, 'courier_requests'), { orderId: o.id, supplierId: user.uid, courier: 'Shiprocket / Delhivery', deliveryCharge: '40+50=90', status: 'support_ke_pass', time: serverTimestamp() }); Alert.alert('Ho Gaya', 'Courier khud Support ke paas ayega'); }}><Text style={s.btnT}>{sticker ? 'Courier Se Bhejo' : 'Sticker Bina Lock Hai'}</Text></TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({ box: { padding: 16, backgroundColor: '#fff' }, title: { fontSize: 20, fontWeight: 'bold', color: '#0D5CFF' }, sub: { backgroundColor: '#FFF3E0', padding: 8, marginVertical: 8, fontWeight: 'bold', fontSize: 12 }, inp: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginVertical: 5 }, btn: { backgroundColor: '#0D5CFF', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 }, btnT: { color: '#fff', fontWeight: 'bold' }, small: { fontSize: 11, color: 'grey', marginTop: 8 }, cat: { borderWidth: 1, padding: 6, borderRadius: 20, margin: 3 }, catSel: { backgroundColor: '#0D5CFF' }, card: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginVertical: 6 }, smallBtn: { backgroundColor: '#0D5CFF', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 6 } });
