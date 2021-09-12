# haste-semaphore

A simple async semaphore for JavaScript and Typescript.

# Examples

```typescript
import { Semaphore } from 'haste-semaphore';

// The return value of the function passed into `acquireWith` is returned.
//                    vvv                                     vvvvvvvvvv
async function request<T>(url: string, semaphore: Semaphore): Promise<T> {
  // Await here to get a proper stack-trace in case of an error.
  //     vvvvv
  return await semaphore.acquireWith<T>(() => fetch(url).then(res => res.json()));
  //                     ^^^^^^^^^^^
  // This acquires one permit from the semaphore
  // and executes the function once the permit is acquired.
}

// Create a semaphore with one permit
//                             vvv
const semaphore = new Semaphore(1);

// Do many requests
// Only one fetch will happen at any time
const responses = await Promise.all([1, 2, 3, 4, 5].map(i => request(`users/${i}`, semaphore)));
```
