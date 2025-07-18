// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Vector3D {
    int256 x;
    int256 y;
    int256 z;
}

struct Ray3D {
    Vector3D origin;
    Vector3D direction;
    uint256 depthCounter;
    bool allowRefraction;
}

struct SpherePrimitive {
    int256 radius;
    Vector3D position;
    Vector3D emissionColor;
    Vector3D surfaceColor;
    MaterialType materialType;
}

enum MaterialType { Diffuse, Specular, Refractive }

contract SnailShellBenchmark {
    Vector3D public cameraOrigin;
    Vector3D public horizontalIncrement;
    Vector3D public verticalIncrement;
    SpherePrimitive[] public sceneSpheres;
    uint32 internal randomSeed;

    constructor(uint256 imageWidth, uint256 imageHeight) {
        Vector3D memory forwardVector = normalize(Vector3D(0, -42612, -1000000));
        cameraOrigin = Vector3D(50000000, 52000000, 295600000);
        horizontalIncrement = Vector3D(int256(imageWidth * 513500 / imageHeight), 0, 0);
        verticalIncrement = divide(normalize(crossProduct(horizontalIncrement, forwardVector)), 1000000);

        int256 shellTurns = 3;
        int256 segmentsPerTurn = 24;
        int256 initialRadius = 20000000;
        int256 radialGrowth = 10000000;
        int256 shellHeight = 81600000;

        for (int256 index = 0; index < shellTurns * segmentsPerTurn; index++) {
            int256 angleScaled = index * 6283184 * shellTurns / (shellTurns * segmentsPerTurn);
            int256 radiusValue = initialRadius + (radialGrowth * angleScaled) / 1000000;
            int256 cosineValue = cosine(angleScaled);
            int256 sineValue = sine(angleScaled);

            int256 xCoordinate = (radiusValue * cosineValue) / 1000000 + 50000000;
            int256 yCoordinate = (radiusValue * sineValue) / 1000000 + 40800000;

            sceneSpheres.push(SpherePrimitive(
                5000000,
                Vector3D(xCoordinate, yCoordinate, shellHeight),
                Vector3D(0, 0, 0),
                Vector3D(200000, 100000, 50000),
                MaterialType.Diffuse
            ));
        }
    }

    function executeBenchmark() external returns (bytes3) {
        randomSeed = uint32(block.timestamp);
        bytes3 accumulatedColor;
        accumulatedColor = traceSinglePixel(512, 384, 8);
        return accumulatedColor;
    }

    function traceSinglePixel(uint256 pixelX, uint256 pixelY, uint256 samplesPerPixel) internal returns (bytes3) {
        int256 redSum;
        int256 greenSum;
        int256 blueSum;

        for (uint256 sampleIndex = 0; sampleIndex < samplesPerPixel; sampleIndex++) {
            randomSeed = uint32(1103515245 * randomSeed + 12345);
            Vector3D memory randomOffset = Vector3D(
                int256((uint256(pixelX) * 1000000 + uint256(randomSeed) % 500000) / imageWidth()),
                int256((uint256(pixelY) * 1000000 + uint256(randomSeed) % 500000) / imageHeight()),
                1000000
            );
            Vector3D memory rayDirection = normalize(randomOffset);
            Ray3D memory primaryRay = Ray3D(cameraOrigin, rayDirection, 0, false);
            Vector3D memory radianceColor = computeRadiance(primaryRay);

            redSum += radianceColor.x;
            greenSum += radianceColor.y;
            blueSum += radianceColor.z;
        }

        int256 averageRed = redSum / int256(samplesPerPixel);
        int256 averageGreen = greenSum / int256(samplesPerPixel);
        int256 averageBlue = blueSum / int256(samplesPerPixel);

        uint24 packedColor = (uint24(uint256(averageRed)) << 16) | (uint24(uint256(averageGreen)) << 8) | uint24(uint256(averageBlue));
        return bytes3(packedColor);
    }

    function computeRadiance(Ray3D memory currentRay) internal returns (Vector3D memory) {
        if (currentRay.depthCounter > 5) {
            return Vector3D(0, 0, 0);
        }

        (int256 hitDistance, uint256 hitIndex) = findClosestIntersection(currentRay);
        if (hitDistance == 0) {
            return Vector3D(0, 0, 0);
        }

        SpherePrimitive memory hitSphere = sceneSpheres[hitIndex];
        Vector3D memory intersectionPoint = addVectors(currentRay.origin, multiplyVector(currentRay.direction, hitDistance));
        Vector3D memory surfaceNormal = normalize(subtractVectors(intersectionPoint, hitSphere.position));

        currentRay.depthCounter++;
        if (hitSphere.materialType == MaterialType.Diffuse) {
            Ray3D memory scatteredRay = Ray3D(intersectionPoint, surfaceNormal, currentRay.depthCounter, currentRay.allowRefraction);
            return computeRadiance(scatteredRay);
        } else {
            Vector3D memory reflectedDirection = normalize(subtractVectors(currentRay.direction, multiplyVector(surfaceNormal, 2 * dotProduct(surfaceNormal, currentRay.direction) / 1000000)));
            Ray3D memory reflectedRay = Ray3D(intersectionPoint, reflectedDirection, currentRay.depthCounter, currentRay.allowRefraction);
            return computeRadiance(reflectedRay);
        }
    }

    function findClosestIntersection(Ray3D memory rayToTest) internal view returns (int256, uint256) {
        int256 closestDistance;
        uint256 closestIndex;
        for (uint256 sphereIndex = 0; sphereIndex < sceneSpheres.length; sphereIndex++) {
            SpherePrimitive memory sphereToTest = sceneSpheres[sphereIndex];
            Vector3D memory originToCenter = subtractVectors(sphereToTest.position, rayToTest.origin);
            int256 projectionLength = dotProduct(originToCenter, rayToTest.direction) / 1000000;
            int256 discriminant = projectionLength * projectionLength - (dotProduct(originToCenter, originToCenter) - sphereToTest.radius * sphereToTest.radius);

            if (discriminant > 0) {
                int256 squareRootPart = integerSquareRoot(discriminant);
                int256 distanceCandidate = projectionLength - squareRootPart > 1000 ? projectionLength - squareRootPart : projectionLength + squareRootPart;
                if (distanceCandidate > 1000 && (closestDistance == 0 || distanceCandidate < closestDistance)) {
                    closestDistance = distanceCandidate;
                    closestIndex = sphereIndex;
                }
            }
        }
        return (closestDistance, closestIndex);
    }

    function addVectors(Vector3D memory vectorA, Vector3D memory vectorB) internal pure returns (Vector3D memory) {
        return Vector3D(vectorA.x + vectorB.x, vectorA.y + vectorB.y, vectorA.z + vectorB.z);
    }

    function subtractVectors(Vector3D memory vectorA, Vector3D memory vectorB) internal pure returns (Vector3D memory) {
        return Vector3D(vectorA.x - vectorB.x, vectorA.y - vectorB.y, vectorA.z - vectorB.z);
    }

    function multiplyVector(Vector3D memory vectorToScale, int256 scalar) internal pure returns (Vector3D memory) {
        return Vector3D(vectorToScale.x * scalar / 1000000, vectorToScale.y * scalar / 1000000, vectorToScale.z * scalar / 1000000);
    }

    function dotProduct(Vector3D memory vectorA, Vector3D memory vectorB) internal pure returns (int256) {
        return vectorA.x * vectorB.x + vectorA.y * vectorB.y + vectorA.z * vectorB.z;
    }

    function crossProduct(Vector3D memory vectorA, Vector3D memory vectorB) internal pure returns (Vector3D memory) {
        return Vector3D(
            vectorA.y * vectorB.z - vectorA.z * vectorB.y,
            vectorA.z * vectorB.x - vectorA.x * vectorB.z,
            vectorA.x * vectorB.y - vectorA.y * vectorB.x
        );
    }

    function normalize(Vector3D memory vectorToNormalize) internal pure returns (Vector3D memory) {
        int256 lengthValue = integerSquareRoot(vectorToNormalize.x * vectorToNormalize.x + vectorToNormalize.y * vectorToNormalize.y + vectorToNormalize.z * vectorToNormalize.z);
        return Vector3D(vectorToNormalize.x * 1000000 / lengthValue, vectorToNormalize.y * 1000000 / lengthValue, vectorToNormalize.z * 1000000 / lengthValue);
    }

    function divide(Vector3D memory vectorToDivide, int256 divisor) internal pure returns (Vector3D memory) {
        return Vector3D(vectorToDivide.x / divisor, vectorToDivide.y / divisor, vectorToDivide.z / divisor);
    }

    function integerSquareRoot(int256 value) internal pure returns (int256 result) {
        int256 x = value;
        result = (x + 1) / 2;
        while (result * result > x) {
            result = (result + x / result) / 2;
        }
    }

    function sine(int256 angleScaled) internal pure returns (int256) {
        int256 reducedAngle = angleScaled % 6283184;
        int256 term = reducedAngle;
        int256 termPower = reducedAngle;
        int256 factorialDenominator = 1;
        int256 result = 0;
        for (uint256 seriesIndex = 1; seriesIndex <= 5; seriesIndex += 2) {
            termPower = termPower * reducedAngle * reducedAngle / 1000000 / 1000000;
            factorialDenominator *= seriesIndex * (seriesIndex + 1);
            result += termPower / factorialDenominator * (seriesIndex % 4 == 1 ? int256(1) : int256(-1));
        }
        return result;
    }

    function cosine(int256 angleScaled) internal pure returns (int256) {
        int256 sineValue = sine(angleScaled);
        int256 cosineValue = integerSquareRoot(1000000000000 - sineValue * sineValue / 1000000);
        return cosineValue;
    }

    function imageWidth() internal pure returns (uint256) {
        return 1024;
    }

    function imageHeight() internal pure returns (uint256) {
        return 768;
    }
}