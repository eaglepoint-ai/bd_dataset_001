def find_pairs_with_sum(numbers, target):
    result = []
    for i in range(len(numbers)):
        for j in range(len(numbers)):
            if i != j and numbers[i] + numbers[j] == target:
                pair = (numbers[i], numbers[j])
                if pair not in result and (numbers[j], numbers[i]) not in result:
                    result.append(pair)
    return result
