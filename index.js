import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent chama AppRegistry.registerComponent('main', () => App);
// Ele também garante que, seja carregado no Expo Go ou em um build nativo,
// o ambiente seja configurado adequadamente.
registerRootComponent(App);
