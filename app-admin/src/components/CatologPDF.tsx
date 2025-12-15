import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { ProdutoAdmin } from '../types';

// Estilos do PDF (Ajustados para mostrar Descrição)
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #D4AF37', // Dourado
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 24,
    color: '#343434',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 10,
    color: 'gray',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '32%', // ~3 produtos por linha
    marginBottom: 15,
    padding: 8,
    border: '1px solid #eee',
    borderRadius: 4,
    alignItems: 'center',
    height: 230, // Aumentei a altura para caber a descrição
  },
  imageContainer: {
    width: '100%',
    height: 100,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  title: {
    fontSize: 10, // Aumentei um pouco
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    height: 26, // Altura fixa para 2 linhas de título
    overflow: 'hidden',
  },
  description: {
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
    marginBottom: 6,
    height: 24, // Altura fixa para ~2 linhas de descrição
    overflow: 'hidden',
    lineHeight: 1.2,
  },
  code: {
    fontSize: 7,
    color: '#999',
    marginBottom: 4,
    padding: 2,
    backgroundColor: '#f5f5f5',
    borderRadius: 2,
  },
  price: {
    fontSize: 12,
    color: '#D4AF37', // Dourado
    fontWeight: 'bold',
    marginTop: 'auto', // Empurra o preço para o rodapé do card
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'gray',
    fontSize: 8,
    borderTop: '1px solid #eee',
    paddingTop: 10,
  }
});

interface CatalogPDFProps {
  produtos: ProdutoAdmin[];
  storeName: string;
}

const formatCurrency = (value: number) => 
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export const CatalogPDF = ({ produtos, storeName }: CatalogPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.storeName}>{storeName}</Text>
        <Text style={styles.date}>Gerado em: {new Date().toLocaleDateString('pt-BR')}</Text>
      </View>

      {/* Grade de Produtos */}
      <View style={styles.grid}>
        {produtos.map((p) => (
          <View key={p.id} style={styles.card} wrap={false}>
            {/* Foto */}
            <View style={styles.imageContainer}>
              {p.imageUrl ? (
                // @ts-ignore
                <Image src={p.imageUrl} style={styles.image} />
              ) : (
                <Text style={{ fontSize: 8, color: '#ccc' }}>Sem Foto</Text>
              )}
            </View>
            
            {/* Nome do Produto */}
            <Text style={styles.title}>
              {p.name}
            </Text>

            {/* Descrição do Produto (NOVO) */}
            <Text style={styles.description}>
              {p.description || "Sem descrição."}
            </Text>

            {/* Código */}
            <Text style={styles.code}>{p.code || '-'}</Text>

            {/* Preço */}
            <Text style={styles.price}>{formatCurrency(Number(p.salePrice || 0))}</Text>
          </View>
        ))}
      </View>

      {/* Rodapé */}
      <Text style={styles.footer} fixed>
        {storeName} - Catálogo Digital | Fotos meramente ilustrativas | Sujeito a alteração de estoque
      </Text>

    </Page>
  </Document>
);