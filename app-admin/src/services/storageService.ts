import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

export const uploadImageToFirebase = async (file: File, folder: string = 'produtos'): Promise<string> => {
  if (!file) throw new Error("Nenhum ficheiro fornecido.");

  // 1. Cria um nome único para o ficheiro (timestamp + nome original limpo)
  // Ex: 1715000000000_anel-prata.jpg
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
  const fileName = `${Date.now()}_${cleanName}`;
  
  // 2. Cria a referência (o caminho onde vai ficar salvo no Google)
  const storageRef = ref(storage, `${folder}/${fileName}`);

  try {
    // 3. Faz o upload dos bytes
    const snapshot = await uploadBytes(storageRef, file);
    
    // 4. Pede ao Firebase o URL público para download
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro no upload:", error);
    throw new Error("Falha ao fazer upload da imagem para o Firebase.");
  }
};