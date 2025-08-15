import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      alert(`GraphQL hiba: ${message}`);
      console.error(
        "[GraphQL error]",
        "Message:", message,
        "Locations:", locations,
        "Path:", path
      );
    });
  }
  if (networkError) {
    alert(`Network error: ${networkError}`);
    console.error("[Network error]", networkError);
  }
});

const httpLink = new HttpLink({
  uri: "https://countries.trevorblades.com/graphql",
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(), // I use cache, because countries data doesn't change often
});
