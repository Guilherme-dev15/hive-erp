import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

export const uploadImageToFirebase = async (file: File, folder: string = 'produtos'): Promise<string> => {
  if (!file) throw new Error("Nenhum ficheiro fornecido.");

  // Cria um nome único para o ficheiro (timestamp + nome original)
  const fileName = `${Date.now()}_${file.name}`;
  
  // Cria a referência (o caminho onde vai ficar salvo)
  const storageRef = ref(storage, `${folder}/${fileName}`);

  try {
    // 1. Faz o upload
    const snapshot = await uploadBytes(storageRef, file);
    
    // 2. Pega o URL público
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro no upload:", error);
    throw new Error("Falha ao fazer upload da imagem.");
  }
};