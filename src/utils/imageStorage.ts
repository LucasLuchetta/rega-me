import { Directory, File, Paths } from 'expo-file-system';

/**
 * O ImagePicker devolve URIs dentro do diretório de cache do app, que o Android
 * apaga quando o armazenamento fica cheio. Como o caminho é gravado no banco,
 * as fotos das plantas sumiriam sozinhas. Aqui elas são movidas para o
 * diretório de documentos, que só é apagado quando o app é desinstalado.
 */
const PHOTOS_DIR = 'plants';

const getPhotosDirectory = () => {
  const dir = new Directory(Paths.document, PHOTOS_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
};

const isPersisted = (uri: string) => uri.includes(`/${PHOTOS_DIR}/`);

/**
 * Move a imagem escolhida para o armazenamento permanente do app.
 * Em caso de falha devolve o URI original — é melhor uma foto volátil do que
 * bloquear o cadastro da planta.
 */
export const persistImage = (uri: string | null | undefined): string | null => {
  if (!uri) return null;
  if (!uri.startsWith('file://') || isPersisted(uri)) return uri;

  try {
    const source = new File(uri);
    if (!source.exists) return uri;

    const extension = Paths.extname(uri) || '.jpg';
    const name = `plant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
    const destination = new File(getPhotosDirectory(), name);

    source.move(destination);
    return destination.uri;
  } catch (error) {
    if (__DEV__) console.warn('Falha ao salvar a foto no armazenamento permanente:', error);
    return uri;
  }
};

/** Remove uma foto do disco. Ignora URIs que não pertencem ao app. */
export const deleteImage = (uri: string | null | undefined) => {
  if (!uri || !isPersisted(uri)) return;

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    if (__DEV__) console.warn('Falha ao remover a foto:', error);
  }
};
