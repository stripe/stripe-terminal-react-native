class ThreadSafeQueue<T> {
    private var array: [T] = []
    private let queue = DispatchQueue(label: "com.stripe.terminal.reactnative.threadSafeQueue")

    func enqueue(_ element: T) {
        queue.sync {
            self.array.append(element)
        }
    }

    func dequeue() -> T? {
        var element: T?
        queue.sync {
            if !self.array.isEmpty {
                element = self.array.removeFirst()
            }
        }
        return element
    }

    var isEmpty: Bool {
        return queue.sync { self.array.isEmpty }
    }

    var count: Int {
        return queue.sync { self.array.count }
    }
}
