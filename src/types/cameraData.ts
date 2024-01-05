import CameraStreakData from 'types/cameraStreakData'

type CameraStreakAndTotalData = CameraStreakData & { total: number }

type CameraData = {
  busLaneCameraViolations: CameraStreakAndTotalData
  cameraViolations: CameraStreakAndTotalData
  cameraViolationsWithBusLaneCameraViolations: CameraStreakAndTotalData
  redLightCameraViolations: CameraStreakAndTotalData
  speedCameraViolations: CameraStreakAndTotalData
}

export default CameraData
