import { Redirect } from 'expo-router';

/**
 * Root index - redirects to login
 */

export default function Index() {
  return <Redirect href="/login" />;
}
