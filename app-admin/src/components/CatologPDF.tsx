import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { Product } from '../types';

// Registrar fontes (se necessário, certifique-se que os arquivos de fonte estão disponíveis)
// Font.register({
//   family: 'Helvetica',
//   fonts: [
//     { src: '/path/to/Helvetica.ttf' },
//     { src: '/path/to/Helvetica-Bold.ttf', fontWeight: 'bold' },
//   ],
// });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #D4AF37',
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
    width: '32%',
    marginBottom: 15,
    padding: 8,
    border: '1px solid #eee',
    borderRadius: 4,
    alignItems: 'center',
    height: 230,
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
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    height: 26,
    overflow: 'hidden',
  },
  description: {
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
    marginBottom: 6,
    height: 24,
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
    color: '#D4AF37',
    fontWeight: 'bold',
    marginTop: 'auto',
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
  },
});

const formatCurrency = (value: number): string => {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

interface CatalogPDFProps {
  produtos: Product[];
  storeName: string;
}

export const CatalogPDF: React.FC<CatalogPDFProps> = ({
  produtos,
  storeName,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.storeName}>{storeName}</Text>
        <Text style={styles.date}>
          Gerado em: {new Date().toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.grid}>
        {produtos.map((p) => (
          <View key={p.id} style={styles.card} wrap={false}>
            <View style={styles.imageContainer}>
              {p.imageUrl ? (
                <Image
                  src={{
                    uri: p.imageUrl,
                    method: 'GET',
                    headers: {},
                    body: '',
                  }}
                  style={styles.image}
                />
              ) : (
                <Text style={{ fontSize: 8, color: '#ccc' }}>Sem Foto</Text>
              )}
            </View>

            <Text style={styles.title}>{p.name}</Text>
            <Text style={styles.description}>
              {p.description || 'Sem descrição.'}
            </Text>
            <Text style={styles.code}>{p.code || '-'}</Text>
            <Text style={styles.price}>
              {formatCurrency(Number(p.salePrice || 0))}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer} fixed>
        {storeName} - Catálogo Digital | Fotos meramente ilustrativas | Sujeito
        a alteração de estoque
      </Text>
    </Page>
  </Document>
);
